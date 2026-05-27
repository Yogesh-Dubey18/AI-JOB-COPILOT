"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Award, BriefcaseBusiness, ExternalLink, Github, Linkedin, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const themeClasses: Record<string, string> = {
  classic: "bg-background text-foreground",
  compact: "bg-muted/30 text-foreground py-6",
  bold: "bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-slate-50 min-h-screen"
};

const cardThemeClasses: Record<string, string> = {
  classic: "border bg-card text-card-foreground",
  compact: "border bg-background text-foreground",
  bold: "border border-slate-800 bg-slate-950 text-slate-100"
};

type PublicPortfolioClientProps = {
  slug: string;
};

export function PublicPortfolioClient({ slug }: PublicPortfolioClientProps) {
  const portfolio = useQuery({
    queryKey: ["public-portfolio", slug],
    queryFn: () => api.get<any>(`/portfolios/public/${slug}`),
    retry: false
  });

  const data = portfolio.data;
  const shellClass = themeClasses[data?.theme || "classic"] || themeClasses.classic;
  const cardClass = cardThemeClasses[data?.theme || "classic"] || cardThemeClasses.classic;

  return (
    <main className={`min-h-screen ${shellClass}`}>
      <section className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold tracking-wide hover:opacity-85">
          <BriefcaseBusiness className="h-4 w-4 text-primary" />
          <span>AI Job Copilot</span>
        </Link>

        {portfolio.isLoading ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground animate-pulse">
            Loading portfolio...
          </div>
        ) : null}

        {portfolio.isError ? (
          <div className="rounded-md border border-danger/30 bg-danger/5 p-8 text-center text-sm text-danger" role="alert">
            This public portfolio is unavailable, private, or has been unpublished by the owner.
          </div>
        ) : null}

        {data ? (
          <div className="space-y-10">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge className={data.theme === "bold" ? "border-slate-800 text-slate-300" : ""}>
                  Theme: {data.theme}
                </Badge>
                <Badge className="bg-primary text-primary-foreground">Public portfolio</Badge>
              </div>

              <div className="space-y-2">
                <p className={`text-sm font-semibold uppercase tracking-wide ${data.theme === "bold" ? "text-slate-400" : "text-muted-foreground"}`}>
                  {data.title || "Career Portfolio"}
                </p>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                  {data.displayName}
                </h1>
                <p className={`text-xl md:text-2xl font-medium ${data.theme === "bold" ? "text-slate-300" : "text-primary"}`}>
                  {data.headline || data.hero}
                </p>
              </div>

              <p className={`text-base leading-8 max-w-3xl ${data.theme === "bold" ? "text-slate-400" : "text-muted-foreground"}`}>
                {data.about || data.bio}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {data.contactEmail ? (
                  <a href={`mailto:${data.contactEmail}`}>
                    <Button className={data.theme === "bold" ? "bg-slate-100 text-slate-900 hover:bg-slate-200" : ""}>
                      <Mail className="mr-2 h-4 w-4" /> Email Me
                    </Button>
                  </a>
                ) : null}

                {data.contactPhone ? (
                  <a href={`tel:${data.contactPhone}`}>
                    <Button variant="outline" className={data.theme === "bold" ? "border-slate-800 hover:bg-slate-800 text-slate-100" : ""}>
                      <Phone className="mr-2 h-4 w-4" /> {data.contactPhone}
                    </Button>
                  </a>
                ) : null}

                {data.resumeUrl ? (
                  <a href={data.resumeUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" className={data.theme === "bold" ? "border-slate-800 hover:bg-slate-800 text-slate-100" : ""}>
                      <ExternalLink className="mr-2 h-4 w-4" /> Download Resume
                    </Button>
                  </a>
                ) : null}
              </div>

              {(data.githubUrl || data.linkedinUrl || data.links?.githubUrl || data.links?.linkedinUrl) ? (
                <div className="flex items-center gap-4 pt-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${data.theme === "bold" ? "text-slate-500" : "text-muted-foreground"}`}>
                    Profiles:
                  </span>
                  <div className="flex items-center gap-3">
                    {(data.githubUrl || data.links?.githubUrl) ? (
                      <a href={data.githubUrl || data.links?.githubUrl} target="_blank" rel="noreferrer" className="hover:opacity-85" aria-label="GitHub">
                        <Github className="h-5 w-5" />
                      </a>
                    ) : null}
                    {(data.linkedinUrl || data.links?.linkedinUrl) ? (
                      <a href={data.linkedinUrl || data.links?.linkedinUrl} target="_blank" rel="noreferrer" className="hover:opacity-85" aria-label="LinkedIn">
                        <Linkedin className="h-5 w-5 text-blue-500" />
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {data.skills?.length ? (
              <section className="space-y-3">
                <h2 className="text-xl font-bold tracking-tight">Core Competencies</h2>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill: string) => (
                    <Badge key={skill} className={data.theme === "bold" ? "bg-slate-800 text-slate-200 hover:bg-slate-800" : ""}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            ) : null}

            {data.roadmap ? (
              <section className={`rounded-lg p-6 ${cardClass}`}>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">Learning Progress</h2>
                      <p className={`text-xs ${data.theme === "bold" ? "text-slate-400" : "text-muted-foreground"}`}>
                        Tracking target role: <strong className="text-foreground">{data.roadmap.targetRole || "Engineering"}</strong>
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Checklist completeness</span>
                        <span>{data.roadmap.progress || 0}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${data.roadmap.progress || 0}%` }} />
                      </div>
                    </div>
                    {data.roadmap.prioritySkills?.length ? (
                      <div className="space-y-1">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${data.theme === "bold" ? "text-slate-500" : "text-muted-foreground"}`}>
                          Currently Learning
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {data.roadmap.prioritySkills.map((skill: string) => (
                            <Badge key={skill} className={data.theme === "bold" ? "border-slate-800 text-slate-300" : ""}>
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {data.projects?.length ? (
              <section className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Featured Projects</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.projects.map((project: any, index: number) => {
                    const title = typeof project === "object" ? project.title || project.name : String(project);
                    const desc = typeof project === "object" ? project.description : "";
                    const tech = typeof project === "object" ? project.technologies || project.techStack : null;
                    return (
                      <article key={title || index} className={`rounded-lg p-5 flex flex-col justify-between ${cardClass}`}>
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg tracking-tight">{title}</h3>
                          {desc ? (
                            <p className={`text-sm leading-6 ${data.theme === "bold" ? "text-slate-400" : "text-muted-foreground"}`}>
                              {desc}
                            </p>
                          ) : null}
                        </div>
                        {tech?.length ? (
                          <div className="flex flex-wrap gap-1 pt-3">
                            {(Array.isArray(tech) ? tech : String(tech).split(",")).map((item: string) => (
                              <span key={item} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/65 text-muted-foreground">
                                {item.trim()}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
