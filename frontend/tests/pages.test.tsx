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
import BlogPage from "@/app/blog/page";
import ResourcesPage from "@/app/resources/page";
import GitHubAnalyzerPage from "@/app/github-analyzer/page";
import NotificationPreferencesPage from "@/app/settings/notifications/page";
import RecruiterPage from "@/app/recruiters/page";
import CompanyResearchPage from "@/app/company-research/page";
import AnswerVaultPage from "@/app/answer-vault/page";
import CareerVaultPage from "@/app/career-vault/page";
import { t, getStoredLanguage, setStoredLanguage, DEFAULT_LANGUAGE } from "@/lib/i18n";
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
    // Fix 1: Forgot password link must be visible in login mode
    const forgotLink = screen.getByRole("link", { name: /Forgot password/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute("href", "/auth/forgot-password");
    // Fix 10: Google OAuth placeholder button must be disabled (not clickable)
    const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
    expect(googleBtn).toBeDisabled();
    // Phase 3: Login password note must be visible
    expect(screen.getByTestId("login-password-note")).toBeInTheDocument();
  });

  it("register page renders", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Login" }).every((link) => link.getAttribute("href") === "/login")).toBe(true);
    // Fix 2: Full Name field must be present in register mode
    expect(screen.getByPlaceholderText(/Asha Developer/i)).toBeInTheDocument();
    // Fix 10: Google OAuth placeholder button must be disabled in register mode too
    const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
    expect(googleBtn).toBeDisabled();
    // Phase 3: Password guidance must be visible
    expect(screen.getByTestId("password-guidance")).toBeInTheDocument();
  });

  it("shows error for weak password on register", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    
    await user.type(screen.getByPlaceholderText(/Asha Developer/i), "Test User");
    await user.type(screen.getByLabelText(/^Email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^Password$/i), "weak");
    await user.click(within(screen.getByRole("main")).getByRole("button", { name: "Register" }));
    
    await waitFor(() => {
      expect(screen.getByTestId("password-error")).toBeInTheDocument();
      expect(screen.getByTestId("password-error")).toHaveTextContent(/at least 8 characters/i);
    });
  });

  it("shows error for missing uppercase letter in register password", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    
    await user.type(screen.getByPlaceholderText(/Asha Developer/i), "Test User");
    await user.type(screen.getByLabelText(/^Email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^Password$/i), "password123");
    await user.click(within(screen.getByRole("main")).getByRole("button", { name: "Register" }));
    
    await waitFor(() => {
      expect(screen.getByTestId("password-error")).toBeInTheDocument();
      expect(screen.getByTestId("password-error")).toHaveTextContent(/uppercase letter/i);
    });
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

    // The auth-form pings /health on mount, then calls /auth/login on submit.
    // Wait until the login endpoint has been called (at least 2 total fetches).
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/auth/login"))).toBe(true)
    );
    const loginCall = fetchMock.mock.calls.find(([url]) => String(url).includes("/auth/login"))!;
    const [url, options] = loginCall;
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

  it("resume upload page renders with upload guide", () => {
    renderWithProviders(<ResumeUploadPage />);
    expect(screen.getByRole("heading", { name: "Resume upload", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Generate anonymized preview/i)).toBeInTheDocument();
    expect(screen.getByText(/LinkedIn import/i)).toBeInTheDocument();
    // Phase 4: Resume upload guide
    expect(screen.getByTestId("upload-guide")).toBeInTheDocument();
    expect(screen.getByText(/Only PDF and DOCX files/i)).toBeInTheDocument();
  });
  it("resume analyzer page renders", () => {
    renderWithProviders(<ResumeAnalyzerPage />);
    expect(screen.getByText(/AI resume ATS analyzer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job description/i)).toBeInTheDocument();
    expect(screen.getByText(/Anonymize personal details/i)).toBeInTheDocument();
  });

  it("resume analyzer page renders disclaimers and suggestions after analysis", async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (String(url).includes("/resumes") && !String(url).includes("/analyze") && !String(url).includes("/improve")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => [{ _id: "resume-1", fileName: "resume.pdf" }]
        });
      }
      if (String(url).includes("/analyze")) {
        return Promise.resolve({
          ok: true,
          status: 201,
          headers: new Headers(),
          json: async () => ({
            atsScore: 85,
            privacyMode: "standard",
            atsBreakdown: { contactInformation: 10, skillsMatch: 20, experienceProjectQuality: 20, keywords: 15, formatting: 10, actionVerbs: 10, total: 85 },
            improvementSuggestions: ["Add Docker keywords", "Improve project metrics"],
            recruiterView: "Recruiter feedback here."
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({})
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<ResumeAnalyzerPage />);

    await waitFor(() => expect(screen.getByText("resume.pdf")).toBeInTheDocument());
    await user.selectOptions(screen.getByRole("combobox"), "resume-1");
    await user.click(screen.getByRole("button", { name: /Analyze resume/i }));

    await waitFor(() => {
      expect(screen.getByTestId("ats-disclaimer")).toBeInTheDocument();
      expect(screen.getByTestId("suggestions-checklist")).toBeInTheDocument();
      expect(screen.getAllByText("Add Docker keywords")[0]).toBeInTheDocument();
      expect(screen.getByTestId("apply-suggestions-button")).toBeInTheDocument();
    });
  });

  it("job listing page renders and shows action buttons", async () => {
    mockApiResponse({
      items: [
        {
          _id: "job-1",
          title: "Full Stack Engineer",
          company: "Test Co",
          location: "Remote",
          remoteType: "Remote",
          jobType: "Full-time",
          skillsRequired: ["React", "TypeScript"],
          trustScore: 85,
          applyUrl: "https://example.com/apply"
        }
      ],
      total: 1
    });
    renderWithProviders(<JobsPage />);

    // 1. Heading
    expect(screen.getByRole("heading", { name: "Jobs" })).toBeInTheDocument();

    // 2. Mock job card elements
    await waitFor(() => {
      expect(screen.getByText("Full Stack Engineer")).toBeInTheDocument();
      expect(screen.getByText(/Test Co/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Track Full Stack Engineer/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Apply kit/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Official link/i })).toBeInTheDocument();
    });
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

  it("exports page renders and pre-fills input from URL parameters", () => {
    window.history.pushState({}, "", "?versionId=test-resume-version-id&tailoredResumeId=test-tailored-id");

    renderWithProviders(<PdfExportPage />);
    expect(screen.getByRole("heading", { name: /PDF and DOCX exports/i })).toBeInTheDocument();
    
    const resumeInput = screen.getAllByPlaceholderText("Resume or resume version ID")[0] as HTMLInputElement;
    expect(resumeInput.value).toBe("test-resume-version-id");

    const tailoredInput = screen.getByPlaceholderText("Tailored resume ID") as HTMLInputElement;
    expect(tailoredInput.value).toBe("test-tailored-id");

    // Cleanup URL search params
    window.history.pushState({}, "", "/");
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

  it("guided workflow page renders all steps and computes progress dynamically", () => {
    mockApiResponse([]);
    renderWithProviders(<GuidedWorkflowPage />);
    expect(screen.getByRole("heading", { name: /Guided job-search workflow/i })).toBeInTheDocument();
    expect(screen.getByText(/Step 01/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload & analyze your resume/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 7 steps completed/i)).toBeInTheDocument();
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

  it("company research page renders salary templates and add form", () => {
    mockApiResponse([]);
    renderWithProviders(<CompanyResearchPage />);
    expect(screen.getByRole("heading", { name: /Company research & salary readiness/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Salary answer templates/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save company research/i })).toBeInTheDocument();
  });

  it("answer vault page renders tabs and handles template customization", async () => {
    const user = userEvent.setup();
    mockApiResponse([]);
    renderWithProviders(<AnswerVaultPage />);

    // 1. Check title and main heading
    expect(screen.getByRole("heading", { name: /Answer vault & templates/i })).toBeInTheDocument();

    // 2. Check form is visible on active "My Saved Answers" tab
    expect(screen.getByRole("heading", { name: /Add custom answer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save answer/i })).toBeInTheDocument();

    // 3. Switch to Negotiation & Behavioral Templates tab
    const templatesTabBtn = screen.getByRole("button", { name: /Negotiation & Behavioral Templates/i });
    expect(templatesTabBtn).toBeInTheDocument();
    await user.click(templatesTabBtn);

    // 4. Ensure placeholders customization card is rendered
    expect(screen.getByText(/Customize Placeholders/i)).toBeInTheDocument();
    
    // 5. Ensure predefined templates are displayed
    expect(screen.getByRole("heading", { name: /Behavioral Templates/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Salary Templates/i })).toBeInTheDocument();

    // 6. Ensure buttons to copy and save predefined templates are present
    expect(screen.getByRole("button", { name: /Copy Tell me about yourself \(STAR format\)/i })).toBeInTheDocument();
  });

  it("career vault page renders forms and displays records", () => {
    mockApiResponse([]);
    renderWithProviders(<CareerVaultPage />);

    // 1. Check title and main heading
    expect(screen.getByRole("heading", { name: "Career vault" })).toBeInTheDocument();

    // 2. Check form is visible
    expect(screen.getByRole("heading", { name: /Add career entry/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save entry/i })).toBeInTheDocument();
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

  it("resources page renders hero and featured guides", () => {
    const { container } = render(<ResourcesPage />);
    expect(container.querySelector("h1")).toHaveTextContent(/Career Resource Hub/i);
    expect(container.querySelector("main")).toBeInTheDocument();
  });

  it("resources page contains internal CTA links to workflow and resume", () => {
    const { container } = render(<ResourcesPage />);
    const links = Array.from(container.querySelectorAll("a"));
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/resume/analyzer");
    expect(hrefs).toContain("/guided-workflow");
  });

  it("resources page shows AI review privacy disclaimer", () => {
    const { container } = render(<ResourcesPage />);
    expect(container.textContent).toMatch(/AI output should be reviewed before applying/i);
  });

  it("blog page renders heading and guide cards", () => {
    const { container } = render(<BlogPage />);
    expect(container.querySelector("h1")).toHaveTextContent(/job search guides/i);
    expect(container.textContent).toMatch(/ATS-Friendly Resume/i);
  });

  it("blog page CTA links to resume analyzer and resources", () => {
    const { container } = render(<BlogPage />);
    const links = Array.from(container.querySelectorAll("a"));
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/resume/analyzer");
    expect(hrefs).toContain("/resources");
  });

  it("github analyzer page renders form and provider-ready notice", () => {
    renderWithProviders(<GitHubAnalyzerPage />);
    expect(screen.getByRole("heading", { name: /GitHub project analyzer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/GitHub repo URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Project title/i)).toBeInTheDocument();
    expect(screen.getByText(/GitHub API — provider-ready/i)).toBeInTheDocument();
  });

  it("github analyzer page has readme and deployment checklists", () => {
    renderWithProviders(<GitHubAnalyzerPage />);
    expect(screen.getAllByText(/README quality/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Deployment readiness/i).length).toBeGreaterThan(0);
  });

  it("github analyzer page links to career vault and portfolio generator", () => {
    const { container } = renderWithProviders(<GitHubAnalyzerPage />);
    const links = Array.from(container.querySelectorAll("a"));
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/career-vault");
    expect(hrefs).toContain("/portfolio-generator");
  });

  it("notification preferences page renders controls", async () => {
    mockApiResponse({ success: true, data: {
      jobMatchAlertsEnabled: true, minimumMatchScore: 60,
      jobAlertFrequency: "daily", followUpRemindersEnabled: true,
      defaultFollowUpDelayDays: 5, interviewRemindersEnabled: true,
      reminderTimings: ["24h before"], staleApplicationDays: 14,
      staleApplicationRemindersEnabled: true, emailNotificationsEnabled: false,
      calendarRemindersEnabled: false, dashboardNotificationsEnabled: true
    }});
    renderWithProviders(<NotificationPreferencesPage />);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Notification preferences/i })).toBeInTheDocument());
  });

  it("notification preferences page shows provider-ready notice for email and calendar", async () => {
    mockApiResponse({ success: true, data: {
      jobMatchAlertsEnabled: true, minimumMatchScore: 60,
      jobAlertFrequency: "daily", followUpRemindersEnabled: true,
      defaultFollowUpDelayDays: 5, interviewRemindersEnabled: true,
      reminderTimings: ["24h before"], staleApplicationDays: 14,
      staleApplicationRemindersEnabled: true, emailNotificationsEnabled: false,
      calendarRemindersEnabled: false, dashboardNotificationsEnabled: true
    }});
    const { container } = renderWithProviders(<NotificationPreferencesPage />);
    await waitFor(() => expect(container.textContent).toMatch(/provider-ready/i), { timeout: 3000 });
  });

  it("notification preferences page has save button", async () => {
    mockApiResponse({ success: true, data: {
      jobMatchAlertsEnabled: true, minimumMatchScore: 60,
      jobAlertFrequency: "daily", followUpRemindersEnabled: true,
      defaultFollowUpDelayDays: 5, interviewRemindersEnabled: true,
      reminderTimings: ["24h before"], staleApplicationDays: 14,
      staleApplicationRemindersEnabled: true, emailNotificationsEnabled: false,
      calendarRemindersEnabled: false, dashboardNotificationsEnabled: true
    }});
    renderWithProviders(<NotificationPreferencesPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: /Save preferences/i })).toBeInTheDocument(), { timeout: 3000 });
  });

  it("api client automatically refreshes token on 401 and retries original request", async () => {
    const { api } = await import("@/lib/api");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ success: false, message: "Unauthorized" })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ success: true, data: { accessToken: "new-access-token", user: { id: "user-1", fullName: "Asha Dev", email: "asha@example.com", role: "job_seeker" } } })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ success: true, data: { result: "success-data" } })
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.get<{ result: string }>("/resumes");
    expect(result).toEqual({ result: "success-data" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain("/resumes");
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    expect(fetchMock.mock.calls[2][0]).toContain("/resumes");
    expect(window.sessionStorage.getItem("ajc_access_token")).toBe("new-access-token");
  });

  it("google oauth button is disabled when provider is not configured", async () => {
    mockApiResponse({
      success: true,
      data: { google: { configured: false } }
    });
    renderWithProviders(<LoginPage />);
    await waitFor(() => {
      const googleBtn = screen.getByRole("button", { name: /Continue with Google — coming soon/i });
      expect(googleBtn).toBeDisabled();
    });
  });

  it("google oauth button is enabled when provider is configured", async () => {
    mockApiResponse({
      success: true,
      data: { google: { configured: true } }
    });
    renderWithProviders(<LoginPage />);
    await waitFor(() => {
      const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
      expect(googleBtn).not.toBeDisabled();
    });
  });
});

describe("i18n localization", () => {
  it("returns English by default", () => {
    expect(DEFAULT_LANGUAGE).toBe("en");
  });

  it("t() returns correct English string", () => {
    expect(t("nav.dashboard", "en")).toBe("Dashboard");
  });

  it("t() returns correct Hindi string", () => {
    const hindi = t("nav.dashboard", "hi");
    // Hindi translation should be defined and non-empty
    expect(hindi).toBeTruthy();
    // Hindi nav.dashboard should not be same as English (it's in Devanagari)
    expect(hindi).not.toBe("Dashboard");
  });

  it("t() returns Hinglish string", () => {
    expect(t("hero.cta.primary", "hinglish")).toBe("Free mein shuru karo");
  });

  it("t() returns AI review disclaimer for all languages", () => {
    expect(t("disclaimer.aiReview", "en")).toMatch(/AI output should be reviewed/i);
    expect(t("disclaimer.aiReview", "hi")).toMatch(/AI/);
    expect(t("disclaimer.aiReview", "hinglish")).toMatch(/AI/);
  });

  it("t() returns no-auto-apply disclaimer for English", () => {
    expect(t("disclaimer.noAutoApply", "en")).toMatch(/never auto-appl/i);
  });

  it("getStoredLanguage returns default when localStorage is empty", () => {
    localStorage.clear();
    expect(getStoredLanguage()).toBe("en");
  });

  it("setStoredLanguage stores and getStoredLanguage retrieves it", () => {
    setStoredLanguage("hi");
    expect(getStoredLanguage()).toBe("hi");
    setStoredLanguage("en"); // reset
  });
});

describe("recruiter portal", () => {
  it("/recruiters page renders with privacy-first heading", () => {
    const { container } = render(<RecruiterPage />);
    expect(container.querySelector("h1")).toHaveTextContent(/Recruiter Portal/i);
  });

  it("/recruiters page shows beta status disclaimer", () => {
    const { container } = render(<RecruiterPage />);
    expect(container.textContent).toMatch(/No active recruiter marketplace/i);
  });

  it("/recruiters page shows privacy commitment section", () => {
    const { container } = render(<RecruiterPage />);
    expect(container.textContent).toMatch(/Candidate data is private/i);
  });

  it("/recruiters page has disabled interest form with not-live label", () => {
    const { container } = render(<RecruiterPage />);
    const submitBtn = container.querySelector("button[type=submit]");
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it("/recruiters page has roadmap section", () => {
    const { container } = render(<RecruiterPage />);
    expect(container.textContent).toMatch(/Recruiter portal roadmap/i);
  });

  it("/recruiters page links to candidate privacy policy and register", () => {
    const { container } = render(<RecruiterPage />);
    const links = Array.from(container.querySelectorAll("a"));
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/privacy");
    expect(hrefs).toContain("/register");
  });
});
