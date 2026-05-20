import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const topics = [
  ["Resume workflow", "Upload a resume, run analysis, review ATS gaps, then tailor a version for each serious role."],
  ["Job matching", "Use match score and missing skills as guidance, then apply manually through the official job link."],
  ["Application tracker", "Move applications through stages, add notes, and schedule follow-ups."],
  ["Interview prep", "Generate role-specific prep and practice mock answers without inventing experience."]
];

export default function HelpPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold">Help center</h1>
        <p className="mt-3 text-muted-foreground">Quick operating guide for using AI Job Copilot safely and effectively.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {topics.map(([title, text]) => <Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{text}</p></CardContent></Card>)}
        </div>
      </main>
    </div>
  );
}
