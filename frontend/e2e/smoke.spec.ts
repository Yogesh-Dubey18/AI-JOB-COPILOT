import { expect, test } from "@playwright/test";

test("public pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Upload your resume once/i })).toBeVisible();
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
});

test("protected pages redirect to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByText(/Welcome back/i)).toBeVisible();
});

test("admin pages are protected", async ({ page }) => {
  await page.goto("/admin/system-health");
  await expect(page).toHaveURL(/\/auth\/login/);
});
