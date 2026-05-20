import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <BriefcaseBusiness className="h-5 w-5 text-primary" />
          AI Job Copilot
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/auth/login"><Button variant="ghost">Login</Button></Link>
          <Link href="/auth/register"><Button>Start free</Button></Link>
        </div>
      </div>
    </header>
  );
}
