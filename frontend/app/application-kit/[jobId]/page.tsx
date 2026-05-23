import { redirect } from "next/navigation";

/**
 * /application-kit/[jobId] — canonical alias that forwards to /apply-assistant
 * with the jobId pre-populated via search params.
 * This avoids duplicating the application kit UI.
 */
export default function ApplicationKitJobPage({ params }: { params: { jobId: string } }) {
  redirect(`/apply-assistant?jobId=${encodeURIComponent(params.jobId)}`);
}
