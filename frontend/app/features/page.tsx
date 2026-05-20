import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    "title": "AI Resume Analyzer",
    "text": "ATS score, missing keywords, recruiter view, and improvement suggestions."
  },
  {
    "title": "AI Job Discovery",
    "text": "Daily feed, filters, remote jobs, internships, and high-match roles."
  },
  {
    "title": "AI Resume Builder",
    "text": "Role templates, live preview, version history, and PDF-ready output."
  },
  {
    "title": "AI Apply Assistant",
    "text": "Cover letter, HR email, LinkedIn, WhatsApp, referral, and salary answers."
  },
  {
    "title": "Application Tracker",
    "text": "Kanban and table tracking from saved to selected or rejected."
  },
  {
    "title": "Interview Preparation",
    "text": "Round-wise prep, mock interview scores, and improved answers."
  },
  {
    "title": "Skill Gap Roadmap",
    "text": "Seven-day and thirty-day plans based on target roles."
  },
  {
    "title": "Portfolio Generator",
    "text": "Recruiter-friendly profile, projects, case studies, and public slug."
  },
  {
    "title": "Job Scam Detector",
    "text": "Trust score and red flags before applying."
  },
  {
    "title": "Career Mentor Chat",
    "text": "Context-aware guidance across resume, jobs, and applications."
  }
];

export default function FeaturesPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">Features</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">A complete AI workflow for resume improvement, matching, applications, interviews, skills, portfolio, and safety checks.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <Card key={item.title}><CardContent className="p-5"><h2 className="font-bold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.text}</p></CardContent></Card>)}
        </div>
      </main>
    </div>
  );
}
