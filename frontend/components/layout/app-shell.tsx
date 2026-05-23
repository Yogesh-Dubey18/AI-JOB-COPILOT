import Link from "next/link";
import { ReactNode } from "react";
import { Archive, BarChart3, Bell, Bot, BriefcaseBusiness, Building2, Download, FileText, Gauge, Globe2, Home, Layers, Linkedin, MessageSquare, MessageSquarePlus, Route, Settings, ShieldAlert, UserRound, Users2, Wrench } from "lucide-react";

const nav = [
  ["/dashboard", Home, "Dashboard"],
  ["/guided-workflow", Route, "Workflow"],
  ["/resume/analyzer", FileText, "Resume"],
  ["/jobs", BriefcaseBusiness, "Jobs"],
  ["/applications", Layers, "Applications"],
  ["/interviews", MessageSquare, "Interviews"],
  ["/contacts", Users2, "Contacts"],
  ["/company-research", Building2, "Companies"],
  ["/answer-vault", Archive, "Answers"],
  ["/career-vault", Archive, "Career vault"],
  ["/portfolio-generator", Globe2, "Portfolio"],
  ["/linkedin-optimizer", Linkedin, "LinkedIn"],
  ["/pdf-export", Download, "Exports"],
  ["/skill-gap", Wrench, "Skills"],
  ["/career-mentor-chat", Bot, "Mentor"],
  ["/analytics", BarChart3, "Analytics"],
  ["/job-scam-detector", ShieldAlert, "Scam check"],
  ["/feedback", MessageSquarePlus, "Feedback"],
  ["/settings", Settings, "Settings"]
];

export function AppShell({ children }: { children: ReactNode }) {
  const mobileNav = nav.slice(0, 5);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto border-r bg-card lg:block">
        <div className="flex h-16 items-center gap-2 border-b px-5 font-bold">
          <Gauge className="h-5 w-5 text-primary" />
          AI Job Copilot
        </div>
        <nav aria-label="Primary navigation" className="space-y-1 p-3">
          {nav.map(([href, Icon, label]) => (
            <Link key={String(href)} href={String(href)} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Icon className="h-4 w-4" />
              {String(label)}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:px-8">
          <Link href="/dashboard" className="min-w-0 truncate font-semibold" aria-label="AI Job Copilot dashboard">Career operating system</Link>
          <div className="ml-3 flex shrink-0 items-center gap-2 text-sm text-muted-foreground sm:gap-3">
            <Link href="/notifications" aria-label="Notifications" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"><Bell className="h-4 w-4" /><span className="hidden sm:inline">Notifications</span></Link>
            <Link href="/feedback" aria-label="Feedback" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"><MessageSquarePlus className="h-4 w-4" /><span className="hidden sm:inline">Feedback</span></Link>
            <Link href="/profile" aria-label="Profile" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"><UserRound className="h-4 w-4" /><span className="hidden sm:inline">Profile</span></Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-5 sm:py-6 lg:px-8">{children}</main>
      </div>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur lg:hidden">
        {mobileNav.map(([href, Icon, label]) => (
          <Link key={String(href)} href={String(href)} className="flex min-w-0 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Icon className="h-4 w-4" />
            <span className="max-w-full truncate">{String(label)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
