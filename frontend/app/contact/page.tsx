import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    "title": "Support",
    "text": "Use the in-app feedback module or email support@example.com."
  },
  {
    "title": "Feedback",
    "text": "Tell us what would make your job-search workflow faster and calmer."
  },
  {
    "title": "Security",
    "text": "Report privacy or data issues so they can be handled quickly."
  }
];

export default function ContactPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">Contact</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">Questions, feedback, or partnership ideas for AI Job Copilot.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <Card key={item.title}><CardContent className="p-5"><h2 className="font-bold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.text}</p></CardContent></Card>)}
        </div>
      </main>
    </div>
  );
}
