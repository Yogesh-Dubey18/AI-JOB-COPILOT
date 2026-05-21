import { PublicNav } from "@/components/layout/public-nav";

export default function PrivacyPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">Privacy</h1>
        <p className="mt-4 text-muted-foreground">Professional privacy template for a demo SaaS product. Review with a qualified professional before public commercial launch.</p>
        <div className="mt-8 space-y-6 text-sm text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">Data collected</h2>
            <p className="mt-2">AI Job Copilot stores account, profile, resume, job-search, application, interview, notification, billing mock, feedback, and AI usage metadata needed to provide the service.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">AI privacy</h2>
            <p className="mt-2">Provider keys and secrets must remain on the backend. AI-generated outputs are advisory and user-reviewed; the default AI request tracking stores usage metadata and prompt length, not raw provider prompts.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Data export and deletion</h2>
            <p className="mt-2">Signed-in users can export their data and manage privacy preferences from Settings. Account deletion removes user-owned records from the configured database or local mock store and requires manual review of backups and external providers.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Security retention</h2>
            <p className="mt-2">Security audit logs may be retained in minimized form for abuse prevention, support, and incident review. See the privacy system, data inventory, and retention docs for implementation details.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
