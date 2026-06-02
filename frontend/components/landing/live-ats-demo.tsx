"use client";

import { useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

const SAMPLE_RESUMES = [
  {
    label: "Fresher MERN Draft",
    role: "Full Stack Developer",
    text: `Yogesh Dubey\nEmail: yogesh@example.com\nPhone: 9876543210\n\nObjective:\nPassionate MERN Stack Developer looking for entry level opportunities.\n\nSkills:\nReact, JavaScript, Node.js, Express, MongoDB, HTML, CSS.\n\nProjects:\nAI Job Copilot - A job application tracker using React and Node.js. Integrated MongoDB for user data storage.\nE-commerce Site - Created a responsive frontend using React and Tailwind CSS.`
  },
  {
    label: "Junior React Draft",
    role: "Frontend Developer",
    text: `Priya Sharma\nEmail: priya@example.com\n\nSummary:\nReact developer with hands-on experience building frontend components and styling responsive user interfaces.\n\nSkills:\nReact, TypeScript, Redux Toolkit, Tailwind CSS, REST APIs, Git, Testing.\n\nExperience:\nFrontend Intern at TechLabs (6 months)\n- Developed reusable UI components in React\n- Collaborated with design team to improve page load speed by 20%`
  }
];

export function LiveAtsDemo() {
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [scoreData, setScoreData] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSelectSample = (sample: typeof SAMPLE_RESUMES[0]) => {
    setTargetRole(sample.role);
    setResumeText(sample.text);
    setScoreData(null);
    setError("");
  };

  const handleCheckScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setError("Please paste your resume text or select a sample draft above.");
      return;
    }
    setLoading(true);
    setError("");
    setScoreData(null);

    try {
      const res = await api.post<any>("/demo/ats", { resumeText, targetRole });
      if (res.success && res.data) {
        setScoreData(res.data);
      } else {
        setError(res.error || "Could not analyze resume. Please try again.");
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Rate limit exceeded or connection error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-12" id="ats-demo">
      <Card className="border border-primary/20 bg-background/60 backdrop-blur-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            Try the Live ATS Scanner
          </CardTitle>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Paste your draft resume text to scan it against a target role. No signup required. Max 5 scans per hour.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-xs text-muted-foreground self-center mr-1">Load Sample:</span>
            {SAMPLE_RESUMES.map((sample) => (
              <button
                key={sample.label}
                onClick={() => handleSelectSample(sample)}
                className="text-xs px-3 py-1.5 rounded-full border border-muted hover:border-primary bg-muted/30 transition-all font-medium"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleCheckScore} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="block space-y-1 text-sm font-medium">
                  <span>Target Role</span>
                  <Input
                    placeholder="e.g. Full Stack Developer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    required
                    aria-label="Target Role"
                  />
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block space-y-1 text-sm font-medium">
                  <span>Paste Resume Text</span>
                  <textarea
                    rows={6}
                    placeholder="Paste email, contact, skills, education, and project details here..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    required
                    aria-label="Resume text"
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-danger/20 bg-danger/5 p-3 text-sm text-danger flex items-start gap-2" role="alert">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-center">
              <Button type="submit" disabled={loading} className="w-full md:w-auto min-w-[200px]">
                {loading ? "Analyzing Draft..." : "Scan Resume Draft"}
              </Button>
            </div>
          </form>

          {scoreData && (
            <div className="mt-8 rounded-lg border bg-card/40 p-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="relative flex items-center justify-center h-28 w-28 shrink-0">
                  {/* Circular Score Bar */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" className="stroke-muted" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-primary"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - scoreData.atsScore / 100)}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-bold">{scoreData.atsScore}</span>
                    <span className="text-xs text-muted-foreground block">ATS Score</span>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h3 className="text-lg font-bold">Analysis Results</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      scoreData.resumeLevel === "Excellent" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" :
                      scoreData.resumeLevel === "Good" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" :
                      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}>
                      {scoreData.resumeLevel} Match
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    "{scoreData.scoreExplanation}"
                  </p>
                  <p className="text-xs text-muted-foreground leading-normal">
                    <strong>Recruiter's Perspective: </strong> {scoreData.recruiterView}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 text-sm pt-4 border-t">
                <div className="space-y-2">
                  <h4 className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Strengths
                  </h4>
                  {scoreData.strengths?.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-xs leading-normal">
                      {scoreData.strengths.map((str: string, i: number) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No prominent strengths detected in this draft.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    Gaps & Areas for Improvement
                  </h4>
                  {scoreData.weaknesses?.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-xs leading-normal">
                      {scoreData.weaknesses.map((weak: string, i: number) => (
                        <li key={i}>{weak}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No major weaknesses detected. Good job!</p>
                  )}
                </div>
              </div>

              {scoreData.missingKeywords?.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-bold text-xs">Missing Role Keywords</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {scoreData.missingKeywords.map((kw: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground border">
                        {kw}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Tip: Mirroring these keywords where they truthfully match your developer experience will boost your ATS scan compatibility.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
