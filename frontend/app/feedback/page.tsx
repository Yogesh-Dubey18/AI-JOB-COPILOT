import Link from "next/link";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { PublicNav } from "@/components/layout/public-nav";
import { Button } from "@/components/ui/button";

export default function FeedbackPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Product feedback</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">Share bugs, workflow friction, and improvement ideas so they can be reviewed and turned into issues.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Open dashboard</Button>
          </Link>
        </div>
        <div className="mt-6">
          <FeedbackForm showHistory={false} />
        </div>
      </main>
    </div>
  );
}
