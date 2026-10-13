import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware, protectedRoutes } from "../middleware";

describe("protected app route middleware", () => {
  it("keeps known private data workflows in the protected route registry", () => {
    expect(protectedRoutes).toEqual(expect.arrayContaining([
      "/pdf-export",
      "/guided-workflow",
      "/application-kit",
      "/company-research",
      "/answer-vault",
      "/career-vault",
      "/contacts",
      "/linkedin-optimizer",
      "/github-analyzer",
      "/notifications",
      "/compare",
      "/compare-job"
    ]));
  });

  it("redirects every registered private route family to login with the requested path", () => {
    for (const route of protectedRoutes) {
      const response = middleware(new NextRequest(`https://app.example${route}/nested`));
      const location = new URL(response.headers.get("location")!);

      expect(response.status, route).toBe(307);
      expect(location.pathname, route).toBe("/login");
      expect(location.searchParams.get("next"), route).toBe(`${route}/nested`);
    }
  });

  it("allows a backend auth cookie or frontend session marker for protected pages", () => {
    const backendSession = middleware(new NextRequest("https://app.example/dashboard", {
      headers: { cookie: "accessToken=backend-session" }
    }));
    const frontendSession = middleware(new NextRequest("https://app.example/compare", {
      headers: { cookie: "ajc_session=1" }
    }));

    expect(backendSession.status).toBe(200);
    expect(frontendSession.status).toBe(200);
  });

  it("keeps public routes public and does not protect similarly prefixed unrelated paths", () => {
    for (const pathname of ["/", "/login", "/register", "/features", "/pricing", "/privacy", "/u/public-profile", "/dashboard-preview"]) {
      const response = middleware(new NextRequest(`https://app.example${pathname}`));
      expect(response.status, pathname).toBe(200);
      expect(response.headers.get("location"), pathname).toBeNull();
    }
  });

  it("routes the learning-roadmap alias through the protected skill-roadmap page", () => {
    const response = middleware(new NextRequest("https://app.example/learning-roadmap"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/skill-roadmap");
  });
});
