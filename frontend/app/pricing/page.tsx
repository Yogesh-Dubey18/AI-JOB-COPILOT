import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    "title": "Free",
    "text": "Resume upload, basic ATS score, 5 job matches per day, and application tracker."
  },
  {
    "title": "Pro",
    "text": "Unlimited tailoring, cover letters, interview prep, and daily job digest."
  },
  {
    "title": "Premium",
    "text": "Mock interview, portfolio generator, LinkedIn optimizer, and advanced AI mentor."
  }
];

export default function PricingPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">Pricing</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">Simple plans for different stages of your job search.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <Card key={item.title}><CardContent className="p-5"><h2 className="font-bold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.text}</p></CardContent></Card>)}
        </div>
      </main>
    </div>
  );
}
