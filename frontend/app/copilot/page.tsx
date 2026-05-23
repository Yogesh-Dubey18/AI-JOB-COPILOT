import { redirect } from "next/navigation";

/**
 * /copilot — canonical alias for the guided job-search workflow.
 * Redirects to /guided-workflow to avoid duplicate page content.
 */
export default function CopilotPage() {
  redirect("/guided-workflow");
}
