import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Providers } from "@/app/providers";
import LoginPage from "@/app/auth/login/page";
import RegisterPage from "@/app/auth/register/page";
import DashboardPage from "@/app/dashboard/page";
import ResumeUploadPage from "@/app/resume/upload/page";
import ResumeAnalyzerPage from "@/app/resume/analyzer/page";
import JobsPage from "@/app/jobs/page";
import JobDetailPage from "@/app/jobs/[jobId]/page";
import ApplicationsPage from "@/app/applications/page";
import InterviewsPage from "@/app/interviews/page";
import AnalyticsPage from "@/app/analytics/page";
import NotificationsPage from "@/app/notifications/page";

function renderWithProviders(ui: React.ReactElement) {
  return render(<Providers>{ui}</Providers>);
}

describe("frontend pages", () => {
  it("login page renders", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it("register page renders", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
  });

  it("dashboard renders", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Career operating system/i)).toBeInTheDocument();
  });

  it("resume upload page renders", () => {
    renderWithProviders(<ResumeUploadPage />);
    expect(screen.getByText(/Resume upload/i)).toBeInTheDocument();
  });

  it("resume analyzer page renders", () => {
    renderWithProviders(<ResumeAnalyzerPage />);
    expect(screen.getByText(/AI resume ATS analyzer/i)).toBeInTheDocument();
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

  it("analytics page renders", () => {
    renderWithProviders(<AnalyticsPage />);
    expect(screen.getByText(/Analytics dashboard/i)).toBeInTheDocument();
  });

  it("notifications page renders", () => {
    renderWithProviders(<NotificationsPage />);
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
  });
});
