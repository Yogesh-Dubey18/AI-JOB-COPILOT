import { PublicNav } from "@/components/layout/public-nav";

export default function TermsPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">Terms</h1>
        <p className="mt-4 text-muted-foreground">Template terms for demo and portfolio use. This is not legal advice and must be reviewed by a qualified professional before public commercial launch.</p>
        <div className="mt-8 space-y-6 text-sm text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">Service scope</h2>
            <p className="mt-2">The platform helps job seekers prepare materials and track applications. It does not act as an employer, recruiter, employment agency, legal advisor, financial advisor, or immigration advisor.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">No outcome guarantee</h2>
            <p className="mt-2">AI Job Copilot does not guarantee interviews, offers, salary, selection, employment, or recruiter responses.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">User review required</h2>
            <p className="mt-2">Users must review all AI-generated resumes, messages, application answers, salary answers, and interview content before using them.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Responsible use</h2>
            <p className="mt-2">The platform must not be used to invent experience, auto-apply to jobs, scrape protected job sites unlawfully, or send recruiter messages without user review.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Billing placeholder</h2>
            <p className="mt-2">Billing is mock/provider-ready in this demo. Real subscription terms, taxes, invoices, refunds, and cancellations must be reviewed before charging users.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
