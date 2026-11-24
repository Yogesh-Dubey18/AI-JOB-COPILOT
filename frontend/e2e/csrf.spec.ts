import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * Real-browser CSRF check. Needs the backend running (npm run dev --prefix backend, port 5000,
 * NODE_ENV not "test"). The spec skips itself when the API is unreachable.
 *
 * The "attacker" page is served by a throwaway local server on a random localhost port: same site as the API
 * (so Lax cookies ARE sent) but a different origin, which is exactly what the origin check must catch.
 */
const API = process.env.E2E_API_URL || "http://localhost:5000/api";
let EVIL_ORIGIN = "http://localhost:0"; // real port is assigned in beforeAll
const EVIL_MARKER = "CSRF-EVIL-COMPANY";

async function apiReachable(request: APIRequestContext) {
  try {
    return (await request.get(`${API}/health`, { timeout: 3000 })).ok();
  } catch {
    return false;
  }
}

test.describe("CSRF origin check in a real browser", () => {
  let evilServer: Server | undefined;

  test.beforeAll(async () => {
    // A real server (not page.route) keeps the request loopback-to-loopback, which Chrome allows.
    evilServer = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><body>evil</body></html>");
    });
    await new Promise<void>((resolve, reject) => {
      evilServer!.once("error", reject);
      evilServer!.listen(0, "127.0.0.1", resolve);
    });
    EVIL_ORIGIN = `http://localhost:${(evilServer.address() as AddressInfo).port}`;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve) => (evilServer ? evilServer.close(() => resolve()) : resolve()));
  });

  test("cookie-authenticated writes work from the app origin and are blocked from a foreign origin", async ({ page, context, request }) => {
    test.skip(!(await apiReachable(request)), `Backend not reachable at ${API}`);

    // Register through the real API; the context cookie jar keeps the auth cookies like a logged-in browser.
    const email = `csrf-${Date.now()}@example.com`;
    const registered = await context.request.post(`${API}/auth/register`, {
      data: { fullName: "Csrf Tester", email, password: "Password123!" }
    });
    expect(registered.status()).toBe(201);
    const cookies = await context.cookies(API);
    expect(cookies.map((c) => c.name)).toEqual(expect.arrayContaining(["accessToken", "refreshToken"]));

    // 1. Legitimate: a page on the allowed frontend origin can write with cookies.
    await page.goto("/login");
    const legit = await page.evaluate(async (api) => {
      const res = await fetch(`${api}/applications`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: "Legit Co", role: "Engineer", status: "Saved" })
      });
      return res.status;
    }, API);
    expect(legit).toBe(201);

    // 2. Attack: a foreign origin (same site, so cookies are attached) submits a "simple" form-encoded POST.
    await page.goto(`${EVIL_ORIGIN}/`);
    const attackResponse = page.waitForResponse((res) => res.url() === `${API}/applications` && res.request().method() === "POST");
    await page.evaluate(
      ([api, marker]) => {
        // A classic CSRF form post: top-level navigation, so the browser lets us read the response status.
        const form = document.createElement("form");
        form.method = "POST";
        form.action = `${api}/applications`;
        form.enctype = "application/x-www-form-urlencoded";
        for (const [name, value] of Object.entries({ company: marker, role: "Hacker", status: "Saved" })) {
          const input = document.createElement("input");
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
      },
      [API, EVIL_MARKER]
    );
    const blocked = await attackResponse;
    // The browser really attached the victim's cookies and the evil Origin. The API refuses it with 403
    // (the CORS origin allow-list rejects it first; the CSRF middleware is the second layer behind it).
    const sent = await blocked.request().allHeaders();
    expect(sent.origin).toBe(EVIL_ORIGIN);
    expect(sent.cookie).toContain("accessToken=");
    expect(blocked.status()).toBe(403);

    // 3. The attack must not have created anything.
    const list = await context.request.get(`${API}/applications`);
    expect(list.status()).toBe(200);
    const body = JSON.stringify(await list.json());
    expect(body).toContain("Legit Co");
    expect(body).not.toContain(EVIL_MARKER);
  });
});
