import { expect, test } from "@playwright/test";

test.describe("AI Job Copilot E2E Smoke Tests", () => {
  // 1. Public routes smoke test
  test("public pages render successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Upload your resume once/i })).toBeVisible();

    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();

    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "About" })).toBeVisible();

    await page.goto("/features");
    await expect(page.getByRole("heading", { name: "Features" })).toBeVisible();

    await page.goto("/feedback");
    await expect(page.getByRole("heading", { name: "Product feedback" })).toBeVisible();

    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: "ATS-Friendly Resume" })).toBeVisible();
  });

  // 2. Login page loads
  test("login page loads and displays required fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel(/^Email$/i)).toBeVisible();
    await expect(page.getByLabel(/^Password$/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Forgot password\?/i })).toBeVisible();
  });

  // 3. Register page loads & 4. Password guide renders
  test("register page loads, displays required fields and password guide", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByLabel(/^Full name$/i)).toBeVisible();
    await expect(page.getByLabel(/^Email$/i)).toBeVisible();
    await expect(page.getByLabel(/^Password$/i)).toBeVisible();
    // Verify password guide criteria is visible
    await expect(page.getByTestId("password-guidance")).toBeVisible();
  });

  // 5. Forgot password page loads and shows safe generic messaging
  test("forgot password page loads and shows safe fallback notice", async ({ page }) => {
    // Intercept provider status check to return unconfigured email
    await page.route("**/api/auth/providers/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            google: { configured: false, status: "ready" },
            email: { configured: false, provider: "mock", status: "ready" }
          }
        })
      });
    });

    await page.goto("/auth/forgot-password");
    await expect(page.getByRole("heading", { name: /Reset your password/i })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByText(/Email service not active/i)).toBeVisible();
  });

  // 6. Reset password page loads and shows password requirements
  test("reset password page loads and shows password requirements", async ({ page }) => {
    await page.goto("/auth/reset-password?token=mock-token");
    await expect(page.getByRole("heading", { name: /Reset your password/i })).toBeVisible();
    await expect(page.getByLabel(/^New password$/i)).toBeVisible();
    await expect(page.getByText("Password requirements:")).toBeVisible();
  });

  // 7. Google OAuth button shows provider-ready disabled state when credentials are missing
  test("google oauth button shows coming soon and disabled when unconfigured", async ({ page }) => {
    await page.route("**/api/auth/providers/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            google: { configured: false, status: "ready" },
            email: { configured: false, provider: "mock", status: "ready" }
          }
        })
      });
    });

    await page.goto("/login");
    const googleBtn = page.getByRole("button", { name: /Continue with Google — coming soon/i });
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeDisabled();
    await expect(page.getByText(/Google sign-in is provider-ready. Available after OAuth credentials are configured./i)).toBeVisible();
  });

  // 8. Protected routes redirect to /login when logged out
  const protectedRoutes = [
    "/dashboard",
    "/resume/upload",
    "/resume/analyzer",
    "/jobs",
    "/guided-workflow",
    "/portfolio-generator",
    "/settings/integrations",
    "/interviews/prep",
    "/skill-roadmap"
  ];

  for (const route of protectedRoutes) {
    test(`protected route redirect: ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(route)}`));
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    });
  }

  // 9. Settings integrations page shows provider statuses honestly using safe mocks
  test("settings integrations page shows honest statuses", async ({ page }) => {
    // 1. Mock jobs/sources endpoint to return various states
    await page.route("**/api/jobs/sources", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            externalProviders: [
              { id: "stripe", isLive: true, status: "live" },
              { id: "google_oauth", isLive: false, status: "ready" },
              { id: "sendgrid", isLive: false, status: "not_configured" }
            ]
          }
        })
      });
    });

    // 2. Bypass login by writing session state to sessionStorage and cookie
    await page.goto("/login");
    await page.evaluate(() => {
      window.sessionStorage.setItem("ajc_access_token", "mock-demo-token");
      document.cookie = "ajc_session=1; Path=/; SameSite=Lax";
    });

    // 3. Navigate directly to settings/integrations page
    await page.goto("/settings/integrations");

    // 4. Assert that badges render correctly
    await expect(page.getByRole("heading", { name: /Integrations & provider status/i })).toBeVisible();
    await expect(page.getByText("Live").first()).toBeVisible();
    await expect(page.getByText("Provider-ready").first()).toBeVisible();
    await expect(page.getByText("Not configured").first()).toBeVisible();
  });
});
