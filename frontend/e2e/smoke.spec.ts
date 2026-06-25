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

  test("public portfolio missing slug shows safe unavailable state", async ({ page }) => {
    await page.route("**/api/portfolios/public/demo-style", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Public portfolio not found" })
      });
    });

    await page.goto("/u/demo-style");
    await expect(page.getByText(/public portfolio is unavailable, private, or has been unpublished/i)).toBeVisible();
    await expect(page.getByText(/Email Me/i)).toHaveCount(0);
    await expect(page.getByText(/Download Resume/i)).toHaveCount(0);
  });

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

  test("logged-in session survives a browser reload and navigation", async ({ page }) => {
    // 1. Mock the API endpoints required by login, dashboard, jobs, settings
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
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: "test-real-reload-token",
            refreshToken: "test-real-refresh-token",
            user: { id: "user-1", fullName: "Asha Dev", email: "asha@example.com", role: "job_seeker" }
          }
        }),
        headers: {
          "Set-Cookie": "ajc_session=1; Path=/; SameSite=Lax"
        }
      });
    });
    await page.route("**/api/profile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { fullName: "Asha Dev", email: "asha@example.com" } })
      });
    });
    await page.route("**/api/analytics/overview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { totalDiscovered: 12, totalSavedJobs: 2, totalApplied: 5 } })
      });
    });
    await page.route("**/api/jobs/daily-feed", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { today: [] } })
      });
    });
    await page.route("**/api/jobs/sources", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { externalProviders: [] } })
      });
    });
    await page.route("**/api/jobs?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { items: [], total: 0 } })
      });
    });
    await page.route("**/api/applications", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] })
      });
    });
    await page.route("**/api/jobs/sync-status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { lastSyncedAt: new Date().toISOString(), status: "success" } })
      });
    });
    await page.route("**/api/jobs/viewed", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Marked viewed" })
      });
    });
    await page.route("**/api/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: "test-real-reload-token-refreshed",
            refreshToken: "test-real-refresh-token-refreshed",
            user: { id: "user-1", fullName: "Asha Dev", email: "asha@example.com", role: "job_seeker" }
          }
        })
      });
    });


    // 2. Perform actual login as a test user
    await page.goto("/login");
    await page.getByLabel(/^Email$/i).fill("asha@example.com");
    await page.getByLabel(/^Password$/i).fill("Password123!");
    await page.getByRole("main").getByRole("button", { name: "Login" }).click();

    // 3. Assert navigation to protected route (/dashboard) and verify content
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    // 4. Force a browser page reload and verify we stay logged in on the protected route
    await page.reload();
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    // 5. Navigate to /jobs (another protected route)
    await page.goto("/jobs");
    await expect(page).toHaveURL(/.*jobs/);
    await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible();

    // 6. Force a browser page reload on /jobs and verify we stay logged in
    await page.reload();
    await expect(page).toHaveURL(/.*jobs/);
    await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible();

    // 7. Navigate to /settings/integrations (another protected route)
    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/.*settings\/integrations/);
    await expect(page.getByRole("heading", { name: "Integrations & provider status" })).toBeVisible();

    // 8. Force a browser page reload on /settings/integrations and verify we stay logged in
    await page.reload();
    await expect(page).toHaveURL(/.*settings\/integrations/);
    await expect(page.getByRole("heading", { name: "Integrations & provider status" })).toBeVisible();
  });

  test("the Find Matching Jobs CTA results include match-score data while direct /jobs visit does not", async ({ page }) => {
    // Log requests for debugging
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/")) {
        console.log(`[E2E Request] ${req.method()} ${url}`);
      }
    });

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { fullName: "Asha Dev", email: "asha@example.com" } })
      });
    });
    await page.route("**/api/profile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { fullName: "Asha Dev", email: "asha@example.com" } })
      });
    });
    await page.route("**/api/resumes", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [{ _id: "mock-resume-id", fileName: "resume.pdf", parsedData: { skills: ["React"] } }] })
      });
    });
    await page.route("**/api/resumes/mock-resume-id/analyze", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            atsScore: 85,
            resumeLevel: "Mid-level",
            recruiterView: "Good fit",
            atsBreakdown: { contactInformation: 10, skillsMatch: 20 },
            categoryScores: { content: { score: 18, max: 20, why: "Good summary" } }
          }
        })
      });
    });
    await page.route("**/api/jobs/sources", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { externalProviders: [] } }) });
    });
    await page.route("**/api/applications", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) });
    });
    await page.route("**/api/jobs/sync-status", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { lastSyncedAt: new Date().toISOString(), status: "success" } }) });
    });

    // Programmatic route handler to avoid parameter order mismatch
    await page.route("**/api/jobs*", async (route) => {
      const url = new URL(route.request().url());
      const fromResume = url.searchParams.get("fromResume");
      
      if (fromResume === "mock-resume-id") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              items: [{ _id: "job-1", title: "React Developer", company: "Scitara", location: "Remote", matchScore: 88, sourceType: "curated" }],
              total: 1
            }
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              items: [{ _id: "job-1", title: "React Developer", company: "Scitara", location: "Remote", sourceType: "curated" }],
              total: 1
            }
          })
        });
      }
    });

    await page.context().addCookies([{ name: "ajc_session", value: "1", domain: "localhost", path: "/" }]);

    await page.goto("/resume/analyzer");
    await page.selectOption('select', "mock-resume-id");
    await page.getByLabel(/^Target role$/i).fill("Developer");
    await page.getByRole("button", { name: /^Analyze resume$/i }).click();

    const matchBtn = page.getByRole("button", { name: /^Find Matching Jobs$/i });
    await matchBtn.waitFor({ state: "visible", timeout: 5000 });
    await matchBtn.click();

    await page.waitForURL("**/jobs?fromResume=mock-resume-id&role=Developer");
    await expect(page.getByText("AI match 88%")).toBeVisible();

    await page.goto("/jobs?role=Developer");
    await expect(page.getByText("AI match 88%")).not.toBeVisible();
  });
});
