import React from "react";
import { render, screen, waitFor, within, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/providers";
import LoginPage from "@/app/auth/login/page";
import RegisterPage from "@/app/auth/register/page";
import ForgotPasswordPage from "@/app/auth/forgot-password/page";
import ResetPasswordPage from "@/app/auth/reset-password/page";
import RootLoginPage from "@/app/login/page";
import RootRegisterPage from "@/app/register/page";
import DashboardPage from "@/app/dashboard/page";
import ResumeUploadPage from "@/app/resume/upload/page";
import ResumeAnalyzerPage from "@/app/resume/analyzer/page";
import ResumeBuilderPage from "@/app/resume/builder/page";
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
import SkillRoadmapPage from "@/app/skill-roadmap/page";
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

  it("portfolio generator page renders warning banner, preview card, and triggers PDF export", async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (String(url).includes("/portfolios/slug/")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: true, data: { available: true, slug: "test-developer" } })
        });
      }
      if (String(url).includes("/portfolios/portfolio-1/versions")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: [
              {
                id: "version-1",
                title: "Recruiter draft",
                changeSummary: "Saved before proof updates.",
                visibilityStatus: "private",
                createdAt: "2026-05-27T10:00:00.000Z"
              }
            ]
          })
        });
      }
      if (String(url).includes("/portfolios/storage/status")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: {
              provider: "local",
              status: "local_fallback",
              label: "Local fallback storage (not production-durable)",
              signedUrlTtlSeconds: 900,
              localFallback: true,
              live: false
            }
          })
        });
      }
      if (String(url).includes("/portfolios/portfolio-1/files")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: [
              {
                fileId: "proof-file-1",
                projectId: "case-1",
                fileType: "screenshot",
                originalFilename: "proof.png",
                mimeType: "image/png",
                size: 2048,
                visibility: "private",
                downloadUrl: "/uploads/portfolio-proof/proof.png",
                signedUrlExpiresInSeconds: 900,
                storageStatusLabel: "Local fallback storage (not production-durable)"
              }
            ]
          })
        });
      }
      if (String(url).includes("/portfolios")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => [
            {
              _id: "portfolio-1",
              slug: "test-developer",
              title: "Test Developer Portfolio",
              displayName: "Test Developer",
              headline: "Full Stack Dev",
              theme: "classic",
              isPublished: true,
              skills: ["React", "Node.js"],
              projectCaseStudies: [{ id: "case-1", projectName: "Proof Project" }],
              proofMappings: [{ id: "proof-1", skillName: "React" }]
            }
          ]
        });
      }
      if (String(url).includes("/exports/portfolio")) {
        return Promise.resolve({
          ok: true,
          status: 201,
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: {
              fileUrl: "/uploads/exports/Candidate_Portfolio.pdf",
              fileName: "Candidate_Portfolio.pdf"
            }
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
    renderWithProviders(<PortfolioGeneratorPage />);

    // 1. Heading and warning banner
    expect(screen.getByRole("heading", { name: "Portfolio generator" })).toBeInTheDocument();
    expect(screen.getByTestId("storage-warning")).toBeInTheDocument();
    expect(screen.getByText(/Storage & Access Notice/i)).toBeInTheDocument();
    expect(screen.getByTestId("storage-status-badge")).toHaveTextContent(/Local fallback/i);
    expect(screen.getByText(/Private files are only shared when you approve them/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Signed URL\/download readiness/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("proof-file-readiness")).toBeInTheDocument();
    expect(screen.getByTestId("proof-file-upload-section")).toBeInTheDocument();
    expect(screen.getByText(/Allowed file types: PNG, JPG, WEBP, PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/Max file size: 5MB/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Proof file visibility")).toBeInTheDocument();
    expect(screen.getByText(/Private proof files are only shared publicly when you approve them/i)).toBeInTheDocument();
    expect(screen.getByText(/does not provision a hosted domain/i)).toBeInTheDocument();
    expect(screen.queryByText(/permanent public hosting/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/S3\/R2 Live/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("My Full-Stack Developer Portfolio")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("public-slug-name")).toBeInTheDocument();
    expect(screen.getByText("Show contact email")).toBeInTheDocument();
    expect(screen.getByText("Show phone number")).toBeInTheDocument();
    expect(screen.getByText("Show resume download")).toBeInTheDocument();
    expect(screen.getByText("Show learning achievements")).toBeInTheDocument();
    expect(screen.getByText("Show public case studies")).toBeInTheDocument();
    expect(screen.getByText("Show public proof mapping")).toBeInTheDocument();
    expect(screen.getByText(/Do not claim skills, results, or metrics/i)).toBeInTheDocument();
    expect(screen.getByTestId("case-study-editor")).toBeInTheDocument();
    expect(screen.getByTestId("proof-mapping-cards")).toBeInTheDocument();

    // 2. Render portfolio preview
    await waitFor(() => {
      expect(screen.getByText("test-developer")).toBeInTheDocument();
      expect(screen.getByText("Test Developer Portfolio")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Preview Public Portfolio/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Generate Portfolio PDF/i })).toBeInTheDocument();
      expect(screen.getByTestId("version-history")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save current version/i })).toBeInTheDocument();
      expect(screen.getByText("Recruiter draft")).toBeInTheDocument();
      expect(screen.getByText("proof.png")).toBeInTheDocument();
      expect(screen.getByText(/Owner-maintained proof/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Download signed URL/i })).toBeInTheDocument();
    });

    // 3. Trigger PDF export
    await user.click(screen.getByRole("button", { name: /Generate Portfolio PDF/i }));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Download PDF/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Download PDF/i })).toHaveAttribute(
        "href",
        "http://localhost:5000/uploads/exports/Candidate_Portfolio.pdf"
      );
    });
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

  it("integrations settings page renders and shows honest status badges", async () => {
    mockApiResponse({
      success: true,
      data: {
        externalProviders: [
          { id: "stripe", isLive: true, status: "live" },
          { id: "google_oauth", isLive: false, status: "ready" },
          { id: "sendgrid", isLive: false, status: "not_configured" }
        ]
      }
    });

    renderWithProviders(<IntegrationsSettingsPage />);
    expect(screen.getByRole("heading", { name: /Integrations/i })).toBeInTheDocument();
    expect(screen.getByText(/Provider status is determined by backend/i)).toBeInTheDocument();

    await waitFor(() => {
      // Assert that there's at least one badge for each state based on our mock response
      expect(screen.getByText("Live")).toBeInTheDocument();
      expect(screen.getAllByText("Provider-ready").length).toBeGreaterThan(0);
      expect(screen.getByText("Not configured")).toBeInTheDocument();
    });
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
    expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument();
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

describe("forgot password and reset password pages", () => {
  it("forgot password page renders and submits", async () => {
    mockApiResponse({
      google: { configured: false, status: "ready" },
      email: { configured: false, provider: "mock", status: "ready" }
    });

    renderWithProviders(<ForgotPasswordPage />);

    expect(screen.getByRole("heading", { name: /Reset your password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();

    // Verify fallback warning is shown when email status is ready/not live
    await waitFor(() => {
      expect(screen.getByText(/Email service not active/i)).toBeInTheDocument();
    });

    // Mock forgot-password post
    mockApiResponse({
      success: true,
      message: "If an account exists, password reset instructions will be sent."
    });

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    await userEvent.type(emailInput, "test@example.com");

    const submitBtn = screen.getByRole("button", { name: /Send reset link/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/If an account exists, password reset instructions will be sent/i)).toBeInTheDocument();
    });
  });

  it("reset password page renders and displays complexity checklist", async () => {
    renderWithProviders(<ResetPasswordPage />);

    expect(screen.getByRole("heading", { name: /Reset your password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste the reset token/i)).toBeInTheDocument();
    expect(screen.getByText(/Password requirements:/i)).toBeInTheDocument();
    expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/At least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/At least one lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/At least one number/i)).toBeInTheDocument();
  });
});

describe("resume builder page", () => {
  it("renders empty state when no resume is selected", () => {
    mockApiResponse([]);
    renderWithProviders(<ResumeBuilderPage />);
    expect(screen.getByText(/No Resume Loaded/i)).toBeInTheDocument();
  });

  it("loads resume and shows editor inputs when selection is made", async () => {
    mockApiResponse([
      {
        _id: "res-1",
        fileName: "Base_Resume.pdf",
        parsedData: {
          name: "Alice Developer",
          email: "alice@example.com",
          phone: "1234567890",
          summary: "Professional resume summary",
          skills: ["React", "TypeScript"],
          experience: [{ company: "A", role: "R", bullets: ["Do it."] }],
          projects: [],
          education: []
        }
      }
    ]);

    renderWithProviders(<ResumeBuilderPage />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });
});

describe("apply assistant page", () => {
  it("renders the page and all controls safely without auto-apply language", async () => {
    const fetchMock = mockApiResponse([]);
    
    fetchMock.mockImplementation((url) => {
      if (String(url).includes("/applications")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => [
            {
              _id: "app-1",
              company: "Innovate Co",
              role: "Senior React Developer",
              status: "Saved",
              jobId: "job-1",
              contactId: "contact-1",
              contact: {
                _id: "contact-1",
                name: "Jane Recruiter",
                email: "jane@innovate.com",
                company: "Innovate Co"
              }
            }
          ]
        });
      }
      if (String(url).includes("/resumes/versions")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => [
            {
              _id: "res-ver-1",
              title: "React Developer Version",
              sourceType: "tailored"
            }
          ]
        });
      }
      if (String(url).includes("/contacts")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => [
            {
              _id: "contact-1",
              name: "Jane Recruiter",
              company: "Innovate Co",
              role: "HR Lead",
              email: "jane@innovate.com"
            }
          ]
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => []
      });
    });

    renderWithProviders(<ApplyAssistantPage />);

    expect(screen.getByRole("heading", { name: /AI apply assistant & answers synthesizer/i })).toBeInTheDocument();
    expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument();
    expect(screen.queryByText(/auto-apply/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/auto-submit/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/Select Resume Version/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Select Tone Mode/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Generate Answers/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Vault/i })).toBeInTheDocument();

    const user = userEvent.setup();
    
    fetchMock.mockImplementation((url) => {
      if (String(url).includes("/generate-application-kit")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            _id: "kit-1",
            whyHireYouAnswer: "I am a solid React Developer with matching skills.",
            isFallback: true,
            matchingSkills: ["React", "TypeScript"],
            missingInfo: ["No salary specified."],
            disclaimer: "Manual review required. This is a draft template. Please review before sending."
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => []
      });
    });

    await user.click(screen.getByRole("button", { name: /Generate Answers/i }));

    await waitFor(() => {
      expect(screen.getByText(/Fallback Template Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/Missing Information Alerts/i)).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
    });
  });
});

import InterviewPrepPage from "@/app/interviews/prep/page";

describe("interview prep page", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders interview prep page with mode selector, STAR builder, fallback label, and no auto-apply", async () => {
    const fetchMock = mockApiResponse([]);
    fetchMock.mockImplementation((url: unknown) => {
      const u = String(url);
      if (u.includes("/interviews/prep/modes")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => ([
            { id: "hr", label: "HR interview", icon: "👥" },
            { id: "react", label: "React frontend interview", icon: "⚛️" },
            { id: "salary", label: "Salary discussion", icon: "💰" }
          ])
        });
      }
      if (u.includes("/interviews/prep/question-bank")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => ({
            mode: "hr",
            isFallback: true,
            label: "Fallback Template Mode — AI not configured",
            disclaimer: "These questions are deterministic templates.",
            questions: [
              { question: "Tell me about yourself.", hint: "Use Present → skills → why company." },
              { question: "Why should we hire you?", hint: "Map 3 skills to job requirements." }
            ]
          })
        });
      }
      if (u.includes("/interviews/prep/readiness")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => ({
            readinessScore: 15,
            readinessLevel: "Just getting started",
            scores: [{ label: "Resume uploaded", score: 0, done: false, advice: "Upload your resume" }],
            disclaimer: "This score is a self-assessment heuristic only. It does not guarantee interview success.",
            voiceNote: "Voice mock interview is provider-ready / future enhancement. Text mock interview is available now."
          })
        });
      }
      if (u.includes("/interviews/prep/context")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => ({
            hasContext: false,
            message: "No job or application selected. Select or import a job to get context-specific preparation tips.",
            job: null, company: null, suggestedTopics: [], salaryNotes: []
          })
        });
      }
      return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => [] });
    });

    renderWithProviders(<InterviewPrepPage />);

    // Heading present
    expect(screen.getByRole("heading", { name: /Advanced interview preparation/i })).toBeInTheDocument();

    // Manual Review warning
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument();

    // No auto-apply or auto-send language
    expect(screen.queryByText(/auto-apply/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/auto-send/i)).not.toBeInTheDocument();

    // Voice note
    expect(screen.getByText(/Voice mock interview is provider-ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Text mock interview is available now/i)).toBeInTheDocument();

    // Mode selector loads
    await waitFor(() => {
      expect(screen.getByText("HR interview")).toBeInTheDocument();
    });

    // Fallback label visible
    await waitFor(() => {
      expect(screen.getAllByText(/Fallback Template Mode/i).length).toBeGreaterThan(0);
    });

    // STAR builder controls present
    expect(screen.getByText(/STAR Answer Builder/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate Template/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save to Vault/i })).toBeInTheDocument();

    // Readiness disclaimer
    await waitFor(() => {
      expect(screen.getByText(/heuristic/i)).toBeInTheDocument();
    });
  });

  it("renders /skill-roadmap page with empty states, inputs, checklists, and curated resources", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });

    vi.stubGlobal("fetch", (url: string) => {
      if (url.endsWith("/resumes")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => [
            { _id: "res-1", fileName: "MyResume.pdf", isBaseResume: true, parsedData: { skills: ["React", "JavaScript"] } }
          ]
        });
      }
      if (url.endsWith("/applications")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => [
            { _id: "app-1", jobId: "job-1", company: "Google", role: "Frontend Engineer", status: "Saved" }
          ]
        });
      }
      if (url.endsWith("/ai/skill-gap/plans")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => [
            {
              _id: "plan-1",
              targetRole: "Frontend Engineer",
              missingSkills: ["TypeScript", "Tailwind CSS"],
              prioritySkills: ["TypeScript"],
              sevenDayPlan: ["Study TS core", "Revise React types"],
              thirtyDayPlan: ["Build a large TS app"],
              projectSuggestions: ["Project A", "Project B"],
              progress: 25,
              fallbackResources: [
                { topic: "JavaScript", resource: "MDN Web Docs", url: "https://developer.mozilla.org" }
              ]
            }
          ]
        });
      }
      return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => [] });
    });

    renderWithProviders(<SkillRoadmapPage />);

    // Header check
    expect(screen.getByRole("heading", { name: /Skill gap roadmap/i })).toBeInTheDocument();

    // Check list of missing skills
    await waitFor(() => {
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Tailwind CSS")).toBeInTheDocument();
    });

    // Check ethical warning
    expect(screen.getByText(/Do not add skills to your resume unless you can explain them in an interview/i)).toBeInTheDocument();

    // Check progress rendering
    expect(screen.getByText("25%")).toBeInTheDocument();

    // Check 7-day checklist items
    expect(screen.getByText("Study TS core")).toBeInTheDocument();

    // Check fallback resources title/label
    expect(screen.getByText(/Curated fallback resources — external course provider is not connected/i)).toBeInTheDocument();

    // Check practice questions link
    const practiceLink = screen.getByRole("link", { name: /Practice interview questions/i });
    expect(practiceLink).toBeInTheDocument();
    expect(practiceLink).toHaveAttribute("href", "/interviews/prep?mode=technical");
  });
});

describe("public portfolio page /u/[slug]", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders public portfolio page, showing approved public fields and hiding private fields", async () => {
    vi.stubGlobal("fetch", (url: string) => {
      if (url.includes("/portfolios/public/")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            slug: "test-slug",
            title: "Test Candidate Portfolio",
            displayName: "Test Candidate",
            headline: "Senior Web Engineer",
            about: "I build amazing apps.",
            theme: "bold",
            skills: ["TypeScript", "React"],
            projects: [
              { title: "Project Alpha", description: "Awesome app", technologies: "Next.js" }
            ],
            projectCaseStudies: [
              {
                id: "case-1",
                projectName: "Project Alpha",
                problemSolved: "Made job search evidence easier to explain.",
                techStack: ["Next.js", "Node.js"],
                contribution: "Built public-safe case study cards.",
                keyFeatures: ["Privacy filters"],
                challenges: "Avoiding hidden reviewer notes",
                solutionApproach: "Public projection filters",
                resultLearning: "Proof should stay honest and explainable.",
                proofStatus: "self-reported",
                publicProofNote: "Can walk through the architecture.",
                privateProofNotes: "Private reviewer notes",
                githubUrl: "",
                liveDemoUrl: "",
                proofFiles: [
                  {
                    fileId: "public-case-file",
                    originalFilename: "architecture-proof.pdf",
                    visibility: "publicApproved",
                    downloadUrl: "/uploads/proof/architecture-proof.pdf",
                    signedUrlExpiresInSeconds: 900
                  },
                  {
                    fileId: "private-case-file",
                    originalFilename: "private-proof.pdf",
                    visibility: "private",
                    downloadUrl: "/uploads/proof/private-proof.pdf"
                  }
                ]
              }
            ],
            proofMappings: [
              {
                id: "proof-1",
                skillName: "React",
                projectName: "Project Alpha",
                resumeBullet: "Built public portfolio proof cards.",
                confidence: "strong",
                publicNote: "Mapped to visible project work.",
                privateNotes: "Private proof mapping note",
                githubUrl: "",
                liveDemoUrl: "",
                proofFiles: [
                  {
                    fileId: "public-proof-file",
                    originalFilename: "react-proof.pdf",
                    visibility: "publicApproved",
                    downloadUrl: "/uploads/proof/react-proof.pdf"
                  },
                  {
                    fileId: "private-proof-file",
                    originalFilename: "private-react-proof.pdf",
                    visibility: "private",
                    downloadUrl: "/uploads/proof/private-react-proof.pdf"
                  }
                ]
              }
            ],
            resumeUrl: "https://example.com/my-resume.pdf",
            contactEmail: "candidate@example.com",
            contactPhone: "",
            githubUrl: "https://github.com/test",
            linkedinUrl: "",
            roadmap: {
              targetRole: "Senior React Developer",
              progress: 75,
              prioritySkills: ["TypeScript"]
            },
            sections: {
              showEmail: true,
              showPhone: false,
              showResume: true,
              showProjects: true,
              showSkills: true,
              showLinks: true,
              showRoadmap: true
            }
          })
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });

    renderWithProviders(<PublicPortfolioPage params={{ slug: "test-slug" }} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Test Candidate" })).toBeInTheDocument();
      expect(screen.getByText("Test Candidate Portfolio")).toBeInTheDocument();
      expect(screen.getByText("Senior Web Engineer")).toBeInTheDocument();
      expect(screen.getByText("I build amazing apps.")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Email Me/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download Resume/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/i })).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: /LinkedIn/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Phone/i)).not.toBeInTheDocument();

    expect(screen.getByText("Learning Progress")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Project Case Studies")).toBeInTheDocument();
    expect(screen.getAllByText("Project Alpha").length).toBeGreaterThan(0);
    expect(screen.getByText(/Proof badges are user-maintained/i)).toBeInTheDocument();
    expect(screen.getByText(/Public-approved proof files/i)).toBeInTheDocument();
    expect(screen.getByText(/Owner-maintained file-backed proof/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Signed proof file: architecture-proof\.pdf \(900s\)/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Signed proof file: react-proof\.pdf/i })).toBeInTheDocument();
    expect(screen.getByText("Skill Proof Map")).toBeInTheDocument();
    expect(screen.getAllByText("React").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Private reviewer notes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Private proof mapping note/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-proof\.pdf/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-react-proof\.pdf/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/guaranteed/i)).not.toBeInTheDocument();
  });
});

describe("portfolio builder empty state and custom builder input toggles", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("handles empty state and shows custom form settings, toggles and slug error alerts", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", (url: string) => {
      if (url.includes("/portfolios/slug/")) return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => ({ success: true, data: { available: true } }) });
      if (url.includes("/portfolios/storage/status")) return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => ({ success: true, data: { status: "local_fallback", label: "Local fallback storage (not production-durable)", signedUrlTtlSeconds: 900, live: false } }) });
      if (url.includes("/portfolios")) return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => [] });
      if (url.includes("/resumes")) return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => [] });
      if (url.includes("/profile")) return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => null });
      if (url.includes("/career-vault")) return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => [] });
      if (url.includes("/ai/skill-gap/plans")) return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => [] });
      return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => ({}) });
    });

    renderWithProviders(<PortfolioGeneratorPage />);

    await waitFor(() => {
      expect(screen.getByText("No profile or resume data found")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Upload resume/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add skills/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add projects/i })).toBeInTheDocument();
    });

    cleanup();

    vi.stubGlobal("fetch", (url: string) => {
      if (url.includes("/portfolios/slug/")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => ({ success: true, data: { available: true, slug: "test-dev" } })
        });
      }
      if (url.includes("/portfolios/storage/status")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => ({ success: true, data: { status: "local_fallback", label: "Local fallback storage (not production-durable)", signedUrlTtlSeconds: 900, live: false } })
        });
      }
      if (url.includes("/portfolios/portfolio-1/versions")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => ({ success: true, data: [] })
        });
      }
      if (url.includes("/portfolios/portfolio-1/files")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => ({ success: true, data: [] })
        });
      }
      if (url.includes("/portfolios")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => [
            {
              _id: "portfolio-1",
              slug: "test-dev",
              title: "Test Dev Portfolio",
              displayName: "Test Dev",
              headline: "Web Designer",
              theme: "compact",
              isPublished: false,
              skills: ["JavaScript"]
            }
          ]
        });
      }
      if (url.includes("/resumes")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => [{ _id: "res-1", fileName: "MyResume.pdf", parsedData: { name: "Test Dev", email: "test@dev.com" } }]
        });
      }
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          json: async () => ({ headline: "Web Designer", skills: ["JavaScript"] })
        });
      }
      if (url.includes("/career-vault")) return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => [{ type: "project", title: "Portfolio Builder", description: "Public slug system", skills: ["Next.js"] }] });
      if (url.includes("/ai/skill-gap/plans")) return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => [{ targetRole: "Frontend Engineer", prioritySkills: ["TypeScript"], progress: 20 }] });
      return Promise.resolve({ ok: true, status: 200, headers: new Headers(), json: async () => ({}) });
    });

    renderWithProviders(<PortfolioGeneratorPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Full name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("My Full-Stack Developer Portfolio")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("public-slug-name")).toBeInTheDocument();
      expect(screen.getAllByText("Skills").length).toBeGreaterThan(0);
      expect(screen.getByText("Projects")).toBeInTheDocument();
      expect(screen.getByText("Show contact email")).toBeInTheDocument();
      expect(screen.getByText("Show phone number")).toBeInTheDocument();
      expect(screen.getByText("Show learning achievements")).toBeInTheDocument();
      expect(screen.getByText("Make portfolio publicly visible")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Preview Public Portfolio/i })).toBeInTheDocument();
    });

    const slugInput = screen.getByPlaceholderText("public-slug-name");
    fireEvent.change(slugInput, { target: { value: "abc!" } });
    await waitFor(() => {
      expect(screen.getByText(/Slug can only contain/i)).toBeInTheDocument();
    });
  });
});
