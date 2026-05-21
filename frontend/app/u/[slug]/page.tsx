"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, ExternalLink, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const themeClasses: Record<string, string> = {
  classic: "bg-background text-foreground",
  compact: "bg-muted text-foreground",
  bold: "bg-foreground text-background"
};

export default function PublicPortfolioPage({ params }: { params: { slug: string } }) {
  const portfolio = useQuery({ queryKey: ["public-portfolio", params.slug], queryFn: () => api.get<any>(`/portfolios/public/${params.slug}`), retry: false });
  const data = portfolio.data;
  const shellClass = themeClasses[data?.theme || "classic"] || themeClasses.classic;
  return (
    <main className={`min-h-screen ${shellClass}`}>
      <section className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold"><BriefcaseBusiness className="h-4 w-4" />AI Job Copilot</Link>
        {portfolio.isLoading ? <div className="rounded-md border p-6 text-sm">Loading portfolio...</div> : null}
        {portfolio.isError ? <div className="rounded-md border border-danger p-6 text-sm">This public portfolio is unavailable or private.</div> : null}
        {data ? (
          <div className="space-y-8">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge>{data.theme}</Badge>
                <Badge>Public profile</Badge>
              </div>
              <h1 className="text-4xl font-bold md:text-6xl">{data.displayName || data.hero}</h1>
              <p className="mt-4 text-xl text-muted-foreground">{data.headline || data.hero}</p>
              <p className="mt-5 text-base leading-7 text-muted-foreground">{data.about || data.bio}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {data.contactEmail ? <a href={`mailto:${data.contactEmail}`}><Button><Mail className="h-4 w-4" />Contact</Button></a> : null}
                {data.resumeUrl ? <a href={data.resumeUrl} target="_blank" rel="noreferrer"><Button variant="outline"><ExternalLink className="h-4 w-4" />Resume</Button></a> : null}
              </div>
            </div>

            {data.skills?.length ? (
              <section>
                <h2 className="text-xl font-semibold">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-2">{data.skills.map((skill: string) => <Badge key={skill}>{skill}</Badge>)}</div>
              </section>
            ) : null}

            {data.projects?.length ? (
              <section>
                <h2 className="text-xl font-semibold">Projects</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {data.projects.map((project: any, index: number) => (
                    <article key={String(project.title || project.name || project || index)} className="rounded-md border bg-card p-4 text-card-foreground">
                      <h3 className="font-semibold">{project.title || project.name || String(project)}</h3>
                      {typeof project === "object" && project.description ? <p className="mt-2 text-sm text-muted-foreground">{project.description}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
