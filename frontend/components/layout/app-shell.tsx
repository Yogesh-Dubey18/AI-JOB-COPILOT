"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import {
  Archive, BarChart3, Bell, Bot, BriefcaseBusiness, Building2, ChevronRight,
  FileText, Gauge, Github, Globe2, Home, Layers, Linkedin, LogOut, Menu,
  MessageSquare, MessageSquarePlus, Route, Settings, ShieldAlert, UserRound,
  Users2, Wrench, X
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clearAuthSession } from "@/lib/auth-session";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";

type NavigationItem = { href: string; label: string; icon: typeof Home };
type BillingSummary = {
  currentPlan?: { name?: string };
  usage?: { usedCredits?: number; remainingCredits?: number; plan?: { aiCreditsPerMonth?: number } };
};
type NotificationItem = { isRead?: boolean };

// Resume-specific tools are intentionally kept in the resume section's own navigation.
const nav: NavigationItem[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/guided-workflow", icon: Route, label: "Workflow" },
  { href: "/resume/analyzer", icon: FileText, label: "Resume" },
  { href: "/jobs", icon: BriefcaseBusiness, label: "Jobs" },
  { href: "/applications", icon: Layers, label: "Applications" },
  { href: "/interviews", icon: MessageSquare, label: "Interviews" },
  { href: "/contacts", icon: Users2, label: "Contacts" },
  { href: "/company-research", icon: Building2, label: "Companies" },
  { href: "/answer-vault", icon: Archive, label: "Answers" },
  { href: "/career-vault", icon: Archive, label: "Career vault" },
  { href: "/portfolio-generator", icon: Globe2, label: "Portfolio" },
  { href: "/linkedin-optimizer", icon: Linkedin, label: "LinkedIn" },
  { href: "/github-analyzer", icon: Github, label: "GitHub" },
  { href: "/skill-roadmap", icon: Wrench, label: "Skills" },
  { href: "/career-mentor-chat", icon: Bot, label: "Mentor" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/job-scam-detector", icon: ShieldAlert, label: "Scam check" },
  { href: "/feedback", icon: MessageSquarePlus, label: "Feedback" },
  { href: "/settings", icon: Settings, label: "Settings" }
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

function initials(name?: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("") : "?";
}

function NavigationLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return <>
    {nav.map(({ href, icon: Icon, label }) => {
      const active = isActivePath(pathname, href);
      return <Link
        key={href}
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}
      >
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>{label}</span>
        {active && <ChevronRight aria-hidden="true" className="ml-auto h-4 w-4" />}
      </Link>;
    })}
  </>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname() || "/dashboard";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const user = useQuery({ queryKey: ["me"], queryFn: () => api.get<AuthUser>("/auth/me"), retry: false });
  const billing = useQuery({ queryKey: ["billing"], queryFn: () => api.get<BillingSummary>("/billing/summary"), retry: false });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => api.get<NotificationItem[]>("/notifications?limit=100"), retry: false });

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear the local session even when the server is temporarily unavailable.
    } finally {
      clearAuthSession();
      await queryClient.clear();
      router.replace("/login");
    }
  }

  const planName = billing.data?.currentPlan?.name;
  const used = billing.data?.usage?.usedCredits;
  const creditLimit = billing.data?.usage?.plan?.aiCreditsPerMonth;
  const remaining = billing.data?.usage?.remainingCredits;
  const usagePercent = typeof used === "number" && typeof creditLimit === "number" && creditLimit > 0
    ? Math.min(100, Math.round((used / creditLimit) * 100))
    : null;
  const notificationItems = Array.isArray(notifications.data) ? notifications.data : [];
  const unreadCount = notificationItems.filter((item) => !item.isRead).length;
  const hasUnreadCount = notifications.isSuccess && Array.isArray(notifications.data);
  const mobileNav = [nav[0], nav[3], nav[4], nav[5], nav[14]];

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card lg:flex">
        <Link href="/dashboard" className="flex h-16 shrink-0 items-center gap-2 border-b px-5 font-bold" aria-label="AI Job Copilot dashboard">
          <Gauge aria-hidden="true" className="h-5 w-5 text-primary" />
          <span>AI Job Copilot</span>
        </Link>
        <nav aria-label="Primary navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
          <NavigationLinks pathname={pathname} />
        </nav>
        <div className="border-t p-4">
          <Link href="/settings/billing" className="block rounded-md border bg-muted/40 p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-semibold"><Gauge aria-hidden="true" className="h-3.5 w-3.5 text-primary" />AI usage</span>
              {planName ? <span className="text-muted-foreground">{planName}</span> : null}
            </div>
            {billing.isLoading ? <p className="text-xs text-muted-foreground">Loading usage…</p> : null}
            {billing.isError ? <p className="text-xs text-muted-foreground">Usage unavailable</p> : null}
            {usagePercent !== null ? <>
              <div role="progressbar" aria-label="AI credit plan usage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={usagePercent}>
                <Progress value={usagePercent} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{remaining} credits remaining</p>
            </> : null}
            {billing.isSuccess && usagePercent === null ? <p className="text-xs text-muted-foreground">Usage data not available</p> : null}
          </Link>
        </div>
      </aside>

      <div className="pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
            </button>
            <Link href="/dashboard" className="min-w-0 truncate font-semibold" aria-label="AI Job Copilot dashboard">Career operating system</Link>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-1 text-sm text-muted-foreground sm:gap-2">
            <Link href="/notifications" aria-label={hasUnreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"} className="relative flex h-10 items-center gap-2 rounded-md px-2 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Bell aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
              {hasUnreadCount && unreadCount > 0 ? <span aria-hidden="true" className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
            </Link>
            <Link href="/feedback" aria-label="Feedback" className="hidden h-10 items-center gap-2 rounded-md px-2 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex"><MessageSquarePlus aria-hidden="true" className="h-4 w-4" /><span>Feedback</span></Link>
            <Link href="/profile" aria-label={user.data?.fullName ? `Profile: ${user.data.fullName}` : "Profile"} className="flex h-10 items-center gap-2 rounded-md px-2 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(user.data?.fullName)}</span>
              <span className="hidden max-w-32 truncate sm:inline">{user.data?.fullName || (user.isLoading ? "Loading…" : "Profile")}</span>
            </Link>
            <button type="button" onClick={handleLogout} disabled={loggingOut} aria-label="Logout" className="flex h-10 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60">
              <LogOut aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">{loggingOut ? "Signing out…" : "Logout"}</span>
            </button>
          </div>
        </header>

        {mobileMenuOpen ? <>
          <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <nav id="mobile-navigation-menu" aria-label="All navigation" className="fixed inset-y-16 left-0 z-40 w-[min(20rem,85vw)] space-y-1 overflow-y-auto border-r bg-card p-3 shadow-xl lg:hidden">
            <NavigationLinks pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} />
          </nav>
        </> : null}

        <main className="mx-auto max-w-7xl px-4 py-5 sm:py-6 lg:px-8">{children}</main>
        <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground lg:px-8">
          Built by <a href="https://github.com/Yogesh-Dubey18" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Yogesh Dubey</a>
          {" · "}<a href="https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">GitHub</a>
        </footer>
      </div>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur lg:hidden">
        {mobileNav.map(({ href, icon: Icon, label }) => {
          const active = isActivePath(pathname, href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            <Icon aria-hidden="true" className="h-4 w-4" />
            <span className="max-w-full truncate">{label}</span>
          </Link>;
        })}
      </nav>
    </div>
  );
}
