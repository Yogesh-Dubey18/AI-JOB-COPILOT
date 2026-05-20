import Link from "next/link";
import { ReactNode } from "react";
import { BarChart3, Bell, Bot, BriefcaseBusiness, FileText, Gauge, Home, Layers, MessageSquare, Settings, ShieldAlert, UserRound, Wrench } from "lucide-react";

const nav = [
  ["/dashboard", Home, "Dashboard"],
  ["/resume/analyzer", FileText, "Resume"],
  ["/jobs", BriefcaseBusiness, "Jobs"],
  ["/applications", Layers, "Applications"],
  ["/interviews", MessageSquare, "Interviews"],
  ["/skill-gap", Wrench, "Skills"],
  ["/career-mentor-chat", Bot, "Mentor"],
  ["/analytics", BarChart3, "Analytics"],
  ["/job-scam-detector", ShieldAlert, "Scam check"],
  ["/settings", Settings, "Settings"]
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
        <div className="flex h-16 items-center gap-2 border-b px-5 font-bold">
          <Gauge className="h-5 w-5 text-primary" />
          AI Job Copilot
        </div>
        <nav className="space-y-1 p-3">
          {nav.map(([href, Icon, label]) => (
            <Link key={String(href)} href={String(href)} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Icon className="h-4 w-4" />
              {String(label)}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:px-8">
          <div className="font-semibold">Career operating system</div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link href="/notifications" className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</Link>
            <Link href="/profile" className="flex items-center gap-2"><UserRound className="h-4 w-4" /> Profile</Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
