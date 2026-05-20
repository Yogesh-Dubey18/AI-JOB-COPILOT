import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    "title": "Job seeker first",
    "text": "The platform helps candidates improve applications and interview readiness."
  },
  {
    "title": "Review-based AI",
    "text": "All generated messages and resumes are reviewed by the user before use."
  },
  {
    "title": "Selection focused",
    "text": "Analytics and learning plans keep improving the search after each result."
  }
];

export default function AboutPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">About</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">AI Job Copilot is built around the job seeker journey, not employer posting workflows.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <Card key={item.title}><CardContent className="p-5"><h2 className="font-bold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.text}</p></CardContent></Card>)}
        </div>
      </main>
    </div>
  );
}
