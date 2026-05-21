import { AppShell } from "@/components/layout/app-shell";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export default function FeedbackPage() {
  return (
    <AppShell>
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Product feedback</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">Share bugs, workflow friction, and improvement ideas so they can be reviewed and turned into issues.</p>
        </div>
        <FeedbackForm />
      </section>
    </AppShell>
  );
}
