import { JobDetailClient } from "@/components/jobs/job-detail-client";

export default function JobDetailPage({ params }: { params: { jobId: string } }) {
  return <JobDetailClient jobId={params.jobId} />;
}
