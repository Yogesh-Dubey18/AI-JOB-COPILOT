import { expect, test } from "@playwright/test";

test("production proxy and cookie diagnostics with logout", async ({ page }) => {
  const email = `diag-${Date.now()}@example.com`;
  const password = "Password123!";

  console.log(`[Diagnostic] Using email: ${email}`);

  // Listen to network requests/responses
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/")) {
      console.log(`[Request] ${req.method()} ${url}`);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/api/")) {
      console.log(`[Response] ${res.status()} ${url}`);
      // Log response headers for register and login calls
      if (url.includes("/auth/register") || url.includes("/auth/login") || url.includes("/auth/logout")) {
        console.log("  Headers:");
        const headers = await res.allHeaders();
        for (const [key, val] of Object.entries(headers)) {
          if (key.toLowerCase().includes("cookie") || key.toLowerCase() === "set-cookie") {
            console.log(`    ${key}: ${val}`);
          }
        }
      }
    }
  });

  // 1. Go to register page
  await page.goto("https://ai-job-copilot-frontend.vercel.app/register");
  await page.getByLabel(/^Full name$/i).fill("Diagnostic User");
  await page.getByLabel(/^Email$/i).fill(email);
  await page.getByLabel(/^Password$/i).fill(password);
  await page.getByRole("main").getByRole("button", { name: "Register" }).click();

  // 2. Wait for navigation to dashboard
  console.log("Waiting for navigation to dashboard...");
  try {
    await page.waitForURL("**/dashboard", { timeout: 20000 });
    console.log("Arrived at dashboard!");
  } catch (err) {
    console.log("Failed to navigate to dashboard after registration:", err);
    return;
  }

  // Log cookies in browser context
  let cookies = await page.context().cookies();
  console.log("Cookies after login:", JSON.stringify(cookies, null, 2));

  // Check if client-side has set a non-httpOnly accessToken cookie
  const clientSideAccessToken = cookies.find(c => c.name === "accessToken" && !c.httpOnly);
  if (clientSideAccessToken) {
    console.log("WARNING: Found a non-httpOnly client-set accessToken cookie!");
  } else {
    console.log("SUCCESS: No non-httpOnly client-set accessToken cookie exists.");
  }

  // 3. Try to navigate to Workflow
  console.log("Navigating to Workflow...");
  await page.getByRole("link", { name: "Workflow" }).first().click();
  await page.waitForTimeout(2000);
  console.log(`Current URL: ${page.url()}`);

  // 4. Perform logout
  console.log("Clicking Logout button...");
  await page.getByRole("button", { name: "Logout" }).click();

  // Wait for login redirection
  console.log("Waiting for navigation to login...");
  try {
    await page.waitForURL("**/login", { timeout: 10000 });
    console.log("Successfully redirected to login page!");
  } catch (err) {
    console.log("Failed to redirect to login page after logout:", err);
    return;
  }

  // Log cookies after logout
  cookies = await page.context().cookies();
  console.log("Cookies after logout:", JSON.stringify(cookies, null, 2));
});
