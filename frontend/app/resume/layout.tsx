"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Edit3, FileDown, GitCompare, History, LayoutTemplate, Target } from "lucide-react";

const RESUME_NAV_ITEMS = [
  { href: "/resume/analyzer", label: "Resume Analyzer", icon: BarChart3 },
  { href: "/resume/builder", label: "Resume Builder", icon: Edit3 },
  { href: "/pdf-export", label: "PDF Export", icon: FileDown },
  { href: "/compare", label: "Compare Resumes", icon: GitCompare },
  { href: "/compare-job", label: "Job Match", icon: Target },
  { href: "/resume-examples", label: "Resume Examples", icon: LayoutTemplate },
  { href: "/resume/versions", label: "Analysis History", icon: History }
];

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Resume Sub-Navigation Bar */}
      <div className="border-b bg-card px-4 py-2 flex items-center gap-1 overflow-x-auto rounded-lg shadow-sm">
        {RESUME_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div>{children}</div>
    </div>
  );
}
