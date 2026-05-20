import { PublicNav } from "@/components/layout/public-nav";

export default function PrivacyPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">Privacy</h1>
        <p className="mt-4 text-muted-foreground">Template privacy notice for a demo SaaS product. Review with a qualified professional before public commercial launch.</p>
        <div className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>AI Job Copilot stores account, profile, resume, job-search, application, interview, notification, and AI usage data needed to provide the service.</p>
          <p>Provider keys and secrets must remain on the backend. AI-generated outputs are advisory and user-reviewed.</p>
          <p>Data export, deletion, retention, and legal compliance workflows are planned and must be finalized before handling sensitive production users.</p>
        </div>
      </main>
    </div>
  );
}
