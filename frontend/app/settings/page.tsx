import Link from "next/link";
import { Bell, CreditCard, Download, Lock, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const sections = [
  ["Account security", Lock, "Change password foundation, session review, and account safety checks."],
  ["Notifications", Bell, "Job digest, interview reminders, follow-up reminders, and product updates."],
  ["Billing", CreditCard, "Current plan, mock Stripe-ready checkout, invoices, and usage limits."],
  ["Data export", Download, "Export data placeholder for future privacy workflows."],
  ["Delete account", Trash2, "Manual confirmation placeholder before destructive account deletion exists."]
] as const;

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeading title="Settings" description="Manage account safety, notifications, billing, privacy, and AI usage." />
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([title, Icon, text]) => (
          <Card key={title}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4" />{title}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{text}</p>
              {title === "Billing" ? <Link href="/settings/billing" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Open billing</Link> : <Button variant="outline">Review</Button>}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
