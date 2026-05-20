import { PublicNav } from "@/components/layout/public-nav";

export default function TermsPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">Terms</h1>
        <p className="mt-4 text-muted-foreground">Template terms for demo and portfolio use. Review with a qualified professional before public commercial launch.</p>
        <div className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>The platform helps job seekers prepare materials and track applications. It does not guarantee interviews, offers, or selection.</p>
          <p>Users must review all AI-generated resumes, messages, and interview answers before using them.</p>
          <p>The platform must not be used to invent experience, auto-apply to jobs, or send recruiter messages without user review.</p>
        </div>
      </main>
    </div>
  );
}
