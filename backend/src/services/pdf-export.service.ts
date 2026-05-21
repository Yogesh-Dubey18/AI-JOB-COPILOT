import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords } from "../utils/repository.js";

export type PdfExportType = "resume" | "tailored-resume" | "application-kit" | "portfolio" | "interview-prep";

type PdfSection = {
  heading: string;
  lines: unknown[];
};

const renderer = "native-basic-pdf";
const exportDir = () => path.join(process.cwd(), "uploads", "exports");

function normalizeId(value: unknown) {
  if (value && typeof value === "object" && "_id" in value) return String((value as any)._id);
  return String(value || "");
}

function assertOwned(record: any, userId: string, label: string) {
  if (!record || normalizeId(record.userId) !== normalizeId(userId)) {
    throw new ApiError(404, `${label} not found`);
  }
  return record;
}

function safeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "export";
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  if (value == null) return [];
  return [value];
}

function stringify(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(stringify).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    return Object.entries(object)
      .filter(([, item]) => item != null && item !== "")
      .map(([key, item]) => `${key}: ${stringify(item)}`)
      .join(" | ");
  }
  return String(value);
}

function normalizePdfText(value: unknown): string {
  return stringify(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?")
    .replace(/[\\()]/g, (match: string) => `\\${match}`)
    .trim();
}

function wrapLine(line: string, width = 92) {
  const words = line.split(/\s+/).filter(Boolean);
  const wrapped: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > width) {
      if (current) wrapped.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) wrapped.push(current);
  return wrapped.length ? wrapped : [""];
}

function pdfLines(title: string, sections: PdfSection[]) {
  const lines = [
    "AI Job Copilot Export",
    title,
    `Generated at ${new Date().toISOString()}`,
    ""
  ];
  for (const section of sections) {
    lines.push(section.heading.toUpperCase());
    const sectionLines = section.lines.flatMap((line) => toArray(line)).map(normalizePdfText).filter(Boolean);
    if (!sectionLines.length) lines.push("No saved content yet.");
    for (const line of sectionLines) {
      lines.push(...wrapLine(line).map((item) => `- ${item}`));
    }
    lines.push("");
  }
  return lines.map((line) => normalizePdfText(line));
}

function buildPdfBuffer(title: string, sections: PdfSection[]) {
  const lines = pdfLines(title, sections);
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += 42) {
    pages.push(lines.slice(index, index + 42));
  }
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  const kids: string[] = [];
  let objectId = 4;
  for (const pageLines of pages) {
    const pageId = objectId++;
    const contentId = objectId++;
    kids.push(`${pageId} 0 R`);
    const stream = [
      "BT",
      "/F1 11 Tf",
      "50 790 Td",
      "15 TL",
      ...pageLines.map((line) => `(${line}) Tj T*`),
      "ET"
    ].join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`;
  }
  objects[2] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pages.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, "utf8");
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

function resumeSections(source: any, sourceLabel: string): PdfSection[] {
  const content = source.content || source.parsedData || {};
  return [
    { heading: "Summary", lines: [content.summary || source.rawText?.slice(0, 800) || "No summary saved."] },
    { heading: "Skills", lines: toArray(content.skills) },
    { heading: "Projects", lines: toArray(content.projects) },
    { heading: "Experience", lines: toArray(content.experience) },
    { heading: "Education", lines: toArray(content.education) },
    { heading: "Certifications", lines: toArray(content.certifications) },
    { heading: "Export Notes", lines: [`Source: ${sourceLabel}`, `ATS score: ${source.atsScore || "not scored"}`] }
  ];
}

function tailoredSections(tailored: any, version: any): PdfSection[] {
  return [
    { heading: "Updated Summary", lines: [tailored.updatedSummary || version?.content?.summary] },
    { heading: "Updated Skills", lines: toArray(tailored.updatedSkills || version?.content?.skills) },
    { heading: "Improved Projects", lines: toArray(tailored.improvedProjects || version?.content?.projects) },
    { heading: "Added Keywords", lines: toArray(tailored.addedKeywords) },
    { heading: "Changed Sections", lines: toArray(tailored.changedSections) },
    { heading: "ATS Movement", lines: [`Before: ${tailored.beforeAtsScore || 0}`, `After: ${tailored.afterAtsScore || version?.atsScore || 0}`] }
  ];
}

function applicationKitSections(kit: any): PdfSection[] {
  return [
    { heading: "Cover Letter", lines: [kit.coverLetter] },
    { heading: "HR Email", lines: [kit.hrEmail] },
    { heading: "LinkedIn Message", lines: [kit.linkedinMessage] },
    { heading: "WhatsApp Message", lines: [kit.whatsappMessage] },
    { heading: "Referral Message", lines: [kit.referralMessage] },
    { heading: "Salary Answer", lines: [kit.salaryAnswer] },
    { heading: "Why Hire You", lines: [kit.whyHireYouAnswer] },
    { heading: "Tell Me About Yourself", lines: [kit.tellMeAboutYourselfAnswer] },
    { heading: "Interview Prep Plan", lines: toArray(kit.interviewPrepPlan) }
  ];
}

function portfolioSections(portfolio: any): PdfSection[] {
  const sections = portfolio.sections || {};
  const privacyNotes = [
    sections.showEmail ? "Contact email included by portfolio privacy settings." : "Contact email hidden by portfolio privacy settings.",
    sections.showResume ? "Resume URL included by portfolio privacy settings." : "Resume URL hidden by portfolio privacy settings."
  ];
  return [
    { heading: "Hero", lines: [portfolio.hero || portfolio.headline || portfolio.slug] },
    { heading: "About", lines: [portfolio.about] },
    { heading: "Skills", lines: sections.showSkills === false ? ["Hidden by portfolio privacy settings."] : toArray(portfolio.skills) },
    { heading: "Projects", lines: sections.showProjects === false ? ["Hidden by portfolio privacy settings."] : toArray(portfolio.projects) },
    { heading: "Resume", lines: sections.showResume ? [portfolio.resumeUrl] : ["Hidden by portfolio privacy settings."] },
    { heading: "Contact", lines: sections.showEmail ? [portfolio.contactEmail] : ["Hidden by portfolio privacy settings."] },
    { heading: "Privacy Notes", lines: privacyNotes }
  ];
}

function interviewPrepSections(interview: any): PdfSection[] {
  return [
    { heading: "Round", lines: [`${interview.roundType || "Interview"} round ${interview.roundNumber || 1}`, `Mode: ${interview.mode || "not set"}`] },
    { heading: "Scheduled Details", lines: [`Scheduled at: ${interview.scheduledAt || "not scheduled"}`, `Interviewer: ${interview.interviewerName || "not saved"}`] },
    { heading: "Expected Topics", lines: toArray(interview.topicsExpected) },
    { heading: "Questions Asked", lines: toArray(interview.questionsAsked) },
    { heading: "User Answers", lines: toArray(interview.userAnswers) },
    { heading: "Feedback", lines: [interview.feedback || "No feedback saved yet."] },
    { heading: "Next Steps", lines: toArray(interview.nextSteps) },
    { heading: "Prep Checklist", lines: ["Review role requirements.", "Prepare one project story with metrics.", "Practice concise STAR answers.", "Prepare questions for the interviewer."] }
  ];
}

async function writePdfExport(userId: string, sourceType: PdfExportType, sourceId: string, title: string, sections: PdfSection[], metadata: Record<string, unknown> = {}, privacyNotes: string[] = []) {
  await fs.mkdir(exportDir(), { recursive: true });
  const buffer = buildPdfBuffer(title, sections);
  const shortHash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const fileName = `${Date.now()}-${safeSegment(sourceType)}-${safeSegment(sourceId).slice(-16)}-${shortHash}.pdf`;
  const filePath = path.join(exportDir(), fileName);
  await fs.writeFile(filePath, buffer);
  const fileUrl = `/uploads/exports/${fileName}`;
  return createRecord("pdfExports", {
    userId,
    sourceType,
    sourceId,
    title,
    fileName,
    fileUrl,
    mimeType: "application/pdf",
    byteSize: buffer.byteLength,
    status: "ready",
    renderer,
    storage: "local",
    metadata: { ...metadata, checksumSha256: shortHash },
    privacy: {
      ownerVerified: true,
      redactedFields: [],
      notes: ["Generated file is written to ignored local upload storage.", ...privacyNotes]
    }
  });
}

export async function listPdfExports(userId: string) {
  return findRecords("pdfExports", { userId }, { sort: { createdAt: -1 }, limit: 50 });
}

export async function getPdfExport(userId: string, id: string) {
  return assertOwned(await findRecordById("pdfExports", id), userId, "PDF export");
}

export async function exportResumePdf(userId: string, id: string) {
  const version = await findRecordById("resumeVersions", id);
  if (version && normalizeId(version.userId) === normalizeId(userId)) {
    return writePdfExport(userId, "resume", id, version.title || "Resume version export", resumeSections(version, "resume version"), { resumeVersionId: id });
  }
  const resume = assertOwned(await findRecordById("resumes", id), userId, "Resume");
  return writePdfExport(userId, "resume", id, resume.fileName || "Base resume export", resumeSections(resume, "base resume"), { resumeId: id });
}

export async function exportTailoredResumePdf(userId: string, id: string) {
  const tailored = assertOwned(await findRecordById("tailoredResumes", id), userId, "Tailored resume");
  const version = tailored.resumeVersionId ? await findRecordById("resumeVersions", normalizeId(tailored.resumeVersionId)) : null;
  return writePdfExport(userId, "tailored-resume", id, version?.title || "Tailored resume export", tailoredSections(tailored, version), {
    tailoredResumeId: id,
    resumeVersionId: tailored.resumeVersionId,
    jobId: tailored.jobId
  });
}

export async function exportApplicationKitPdf(userId: string, id: string) {
  const kit = assertOwned(await findRecordById("applicationKits", id), userId, "Application kit");
  return writePdfExport(userId, "application-kit", id, "Application kit export", applicationKitSections(kit), {
    applicationKitId: id,
    jobId: kit.jobId,
    resumeVersionId: kit.resumeVersionId
  });
}

export async function exportPortfolioPdf(userId: string, id: string) {
  const portfolio = assertOwned(await findRecordById("portfolios", id), userId, "Portfolio");
  return writePdfExport(userId, "portfolio", id, portfolio.hero || portfolio.slug || "Portfolio export", portfolioSections(portfolio), {
    portfolioId: id,
    slug: portfolio.slug,
    isPublished: Boolean(portfolio.isPublished)
  }, ["Portfolio section visibility settings were applied to this export."]);
}

export async function exportInterviewPrepPdf(userId: string, id: string) {
  const interview = assertOwned(await findRecordById("interviews", id), userId, "Interview");
  return writePdfExport(userId, "interview-prep", id, `${interview.roundType || "Interview"} prep export`, interviewPrepSections(interview), {
    interviewId: id,
    applicationId: interview.applicationId
  });
}
