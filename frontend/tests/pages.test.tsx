import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/providers";
import LoginPage from "@/app/auth/login/page";
import RegisterPage from "@/app/auth/register/page";
import RootLoginPage from "@/app/login/page";
import RootRegisterPage from "@/app/register/page";
import DashboardPage from "@/app/dashboard/page";
import ResumeUploadPage from "@/app/resume/upload/page";
import ResumeAnalyzerPage from "@/app/resume/analyzer/page";
import JobsPage from "@/app/jobs/page";
import JobDetailPage from "@/app/jobs/[jobId]/page";
import ApplicationsPage from "@/app/applications/page";
import InterviewsPage from "@/app/interviews/page";
import InterviewHistoryPage from "@/app/interviews/history/page";
import PdfExportPage from "@/app/pdf-export/page";
import AnalyticsPage from "@/app/analytics/page";
import NotificationsPage from "@/app/notifications/page";
import BillingSettingsPage from "@/app/settings/billing/page";
import PrivacySettingsPage from "@/app/settings/privacy/page";
import IntegrationsSettingsPage from "@/app/settings/integrations/page";
import PrivacyPage from "@/app/privacy/page";
import PricingPage from "@/app/pricing/page";
import TermsPage from "@/app/terms/page";
import OfflinePage from "@/app/offline/page";
import FeedbackPage from "@/app/feedback/page";
import PortfolioGeneratorPage from "@/app/portfolio-generator/page";
import PublicPortfolioPage from "@/app/u/[slug]/page";
import AdminDashboardPage from "@/app/admin/dashboard/page";
import AdminFeedbackPage from "@/app/admin/feedback/page";
import AdminMonitoringPage from "@/app/admin/monitoring/page";
import GuidedWorkflowPage from "@/app/guided-workflow/page";
import ContactsPage from "@/app/contacts/page";
import ApplyAssistantPage from "@/app/apply-assistant/page";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/status-state";

function renderWithProviders(ui: React.ReactElement) {
  return render(<Providers>{ui}</Providers>);
}

const originalFetch = globalThis.fetch;

function mockApiResponse(payload: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    headers: new Headers(),
    json: async () => payload
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  document.cookie = "ajc_session=; Path=/; Max-Age=0; SameSite=Lax";
});

describe("frontend pages", () => {
  it("login page renders", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create an account/i })).toHaveAttribute("href", "/register");
  });

  it("register page renders", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Login" }).every((link) => link.getAttribute("href") === "/login")).toBe(true);
  });

  it("top-level login and register routes render", () => {
    renderWithProviders(<RootLoginPage />);
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();

    renderWithProviders(<RootRegisterPage />);
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
  });

  it("login submit calls the auth endpoint and stores browser auth state", async () => {
    const fetchMock = mockApiResponse({
      success: true,
      data: {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        user: { id: "user-1", fullName: "Asha Dev", email: "asha@example.com", role: "job_seeker" }
      }
    });
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText(/^Email$/i), "asha@example.com");
    await user.type(screen.getByLabelText(/^Password$/i), "Password123!");
    await user.click(within(screen.getByRole("main")).getByRole("button", { name: "Login" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/auth\/login$/);
    expect(options).toMatchObject({ method: "POST", credentials: "include" });
    expect(JSON.parse(String(options.body))).toEqual({ email: "asha@example.com", password: "Password123!" });
    expect(window.sessionStorage.getItem("ajc_access_token")).toBe("test-access-token");
    expect(document.cookie).toContain("ajc_session=1");
  });

  it("login failure shows a safe error state", async () => {
    mockApiResponse({ success: false, message: "Invalid email or password" }, false, 401);
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText(/^Email$/i), "asha@example.com");
    await user.type(screen.getByLabelText(/^Password$/i), "WrongPass123!");
    await user.click(within(screen.getByRole("main")).getByRole("button", { name: "Login" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/Invalid email or password/i));
    expect(window.sessionStorage.getItem("ajc_access_token")).toBeNull();
    expect(document.cookie).not.toContain("ajc_session=1");
  });

  it("dashboard renders", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Career operating system/i)).toBeInTheDocument();
  });

  it("resume upload page renders", () => {
    renderWithProviders(<ResumeUploadPage />);
    expect(screen.getByText(/Resume upload/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate anonymized preview/i)).toBeInTheDocument();
    expect(screen.getByText(/LinkedIn import/i)).toBeInTheDocument();
  });

  it("resume analyzer page renders", () => {
    renderWithProviders(<ResumeAnalyzerPage />);
    expect(screen.getByText(/AI resume ATS analyzer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job description/i)).toBeInTheDocument();
    expect(screen.getByText(/Anonymize personal details/i)).toBeInTheDocument();
  });

  it("job listing page renders", () => {
    renderWithProviders(<JobsPage />);
    expect(screen.getByRole("heading", { name: "Jobs" })).toBeInTheDocument();
  });

  it("job detail page renders", () => {
    renderWithProviders(<JobDetailPage params={{ jobId: "job-1" }} />);
    expect(screen.getByText(/Job detail/i)).toBeInTheDocument();
  });

  it("application tracker page renders", () => {
    renderWithProviders(<ApplicationsPage />);
    expect(screen.getByText(/Application tracker/i)).toBeInTheDocument();
  });

  it("interview prep page renders", () => {
    renderWithProviders(<InterviewsPage />);
    expect(screen.getByText(/Interview tracker/i)).toBeInTheDocument();
  });

  it("interview history page renders", () => {
    renderWithProviders(<InterviewHistoryPage />);
    expect(screen.getByText(/Interview history/i)).toBeInTheDocument();
  });

  it("exports page renders", () => {
    renderWithProviders(<PdfExportPage />);
    expect(screen.getByRole("heading", { name: "PDF exports" })).toBeInTheDocument();
  });

  it("analytics page renders", () => {
    renderWithProviders(<AnalyticsPage />);
    expect(screen.getByText(/Analytics dashboard/i)).toBeInTheDocument();
  });

  it("notifications page renders", () => {
    renderWithProviders(<NotificationsPage />);
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
  });

  it("billing settings page renders", () => {
    renderWithProviders(<BillingSettingsPage />);
    expect(screen.getByText(/Billing and usage/i)).toBeInTheDocument();
  });

  it("privacy settings page renders", () => {
    renderWithProviders(<PrivacySettingsPage />);
    expect(screen.getByText(/Privacy and data/i)).toBeInTheDocument();
  });

  it("portfolio generator page renders", () => {
    renderWithProviders(<PortfolioGeneratorPage />);
    expect(screen.getByRole("heading", { name: "Portfolio generator" })).toBeInTheDocument();
  });

  it("public portfolio page renders loading state", () => {
    renderWithProviders(<PublicPortfolioPage params={{ slug: "demo" }} />);
    expect(screen.getByText(/Loading portfolio/i)).toBeInTheDocument();
  });

  it("public privacy page renders", () => {
    renderWithProviders(<PrivacyPage />);
    expect(screen.getByRole("heading", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByText(/Data export/i)).toBeInTheDocument();
  });

  it("public pricing page renders commercial disclaimer", () => {
    renderWithProviders(<PricingPage />);
    expect(screen.getByRole("heading", { name: "Pricing" })).toBeInTheDocument();
    expect(screen.getByText(/Commercial readiness note/i)).toBeInTheDocument();
  });

  it("public terms page renders professional placeholder", () => {
    renderWithProviders(<TermsPage />);
    expect(screen.getByRole("heading", { name: "Terms" })).toBeInTheDocument();
    expect(screen.getByText(/No outcome guarantee/i)).toBeInTheDocument();
  });

  it("offline page renders", () => {
    renderWithProviders(<OfflinePage />);
    expect(screen.getByRole("heading", { name: "You are offline" })).toBeInTheDocument();
  });

  it("feedback page renders", () => {
    renderWithProviders(<FeedbackPage />);
    expect(screen.getByRole("heading", { name: "Product feedback" })).toBeInTheDocument();
    expect(screen.getByText(/Public feedback mode/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Login/i })).toHaveAttribute("href", "/login");
  });

  it("admin dashboard renders", () => {
    renderWithProviders(<AdminDashboardPage />);
    expect(screen.getByText(/Admin dashboard/i)).toBeInTheDocument();
  });

  it("admin feedback page renders", () => {
    renderWithProviders(<AdminFeedbackPage />);
    expect(screen.getByRole("heading", { name: "Feedback operations" })).toBeInTheDocument();
  });

  it("admin monitoring page renders", () => {
    renderWithProviders(<AdminMonitoringPage />);
    expect(screen.getByRole("heading", { name: "Monitoring" })).toBeInTheDocument();
  });

  it("integrations settings page renders", () => {
    renderWithProviders(<IntegrationsSettingsPage />);
    expect(screen.getByRole("heading", { name: /Integrations/i })).toBeInTheDocument();
    expect(screen.getByText(/Provider status is determined by backend/i)).toBeInTheDocument();
  });

  it("guided workflow page renders all steps", () => {
    renderWithProviders(<GuidedWorkflowPage />);
    expect(screen.getByRole("heading", { name: /Guided job-search workflow/i })).toBeInTheDocument();
    expect(screen.getByText(/Step 01/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload & analyze your resume/i)).toBeInTheDocument();
  });

  it("recruiter contacts page renders", () => {
    renderWithProviders(<ContactsPage />);
    expect(screen.getByRole("heading", { name: /Recruiter contacts/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add contact/i })).toBeInTheDocument();
  });

  it("apply assistant page renders review disclaimer", () => {
    renderWithProviders(<ApplyAssistantPage />);
    expect(screen.getByText(/AI apply assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/Review and personalise every generated section/i)).toBeInTheDocument();
  });

  it("shared UX states expose accessible status and alert roles", () => {
    render(<>
      <LoadingState title="Loading test" description="Waiting for data" />
      <EmptyState title="Empty test" description="No records" />
      <ErrorState title="Error test" description="Request failed" />
    </>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Loading test/i)).toBeInTheDocument();
    expect(screen.getByText(/Empty test/i)).toBeInTheDocument();
    expect(screen.getByText(/Error test/i)).toBeInTheDocument();
  });
});
