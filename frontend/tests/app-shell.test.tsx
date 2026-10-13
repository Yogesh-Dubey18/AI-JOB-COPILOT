import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/app-shell";
import { api } from "@/lib/api";
import { clearAuthSession } from "@/lib/auth-session";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard", replace: vi.fn() }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    usePathname: () => navigation.pathname,
    useRouter: () => ({ replace: navigation.replace, push: vi.fn() })
  };
});
vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/lib/auth-session", () => ({ clearAuthSession: vi.fn() }));

function renderShell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><AppShell><div>Page content</div></AppShell></QueryClientProvider>);
}

describe("AppShell", () => {
  beforeEach(() => {
    navigation.pathname = "/dashboard";
    navigation.replace.mockReset();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset().mockResolvedValue({});
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === "/auth/me") return { id: "u1", fullName: "Yogesh Dubey", email: "y@example.test", role: "job_seeker" } as never;
      if (path === "/billing/summary") return { currentPlan: { name: "Free" }, usage: { usedCredits: 12, remainingCredits: 38, plan: { aiCreditsPerMonth: 50 } } } as never;
      if (path.startsWith("/notifications")) return [{ isRead: false }, { isRead: true }] as never;
      return [] as never;
    });
  });
  afterEach(() => cleanup());

  it("renders live profile, billing usage, and unread notifications", async () => {
    renderShell();
    expect(await screen.findByText("Yogesh Dubey")).toBeInTheDocument();
    expect(await screen.findByText("38 credits remaining")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "AI credit plan usage" })).toHaveAttribute("aria-valuenow", "24");
    expect(screen.getByRole("link", { name: "Notifications, 1 unread" })).toBeInTheDocument();
    expect(screen.queryByText("90 / 100")).not.toBeInTheDocument();
  });

  it("marks nested routes active and exposes the full mobile navigation menu", async () => {
    navigation.pathname = "/jobs/job-123/tailor-resume";
    renderShell();
    await screen.findByText("Yogesh Dubey");
    const jobs = screen.getAllByRole("link", { name: "Jobs" });
    expect(jobs.some((link) => link.getAttribute("aria-current") === "page")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getByRole("navigation", { name: "All navigation" })).toBeInTheDocument();
    const companyLink = within(screen.getByRole("navigation", { name: "All navigation" })).getByRole("link", { name: "Companies" });
    companyLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(companyLink);
    expect(screen.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute("aria-expanded", "false");
  });

  it("clears the local session and redirects even when server logout fails", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("offline"));
    renderShell();
    await screen.findByText("Yogesh Dubey");
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await waitFor(() => {
      expect(clearAuthSession).toHaveBeenCalledOnce();
      expect(navigation.replace).toHaveBeenCalledWith("/login");
    });
  });
});
