import fs from "node:fs/promises";
import path from "node:path";
import { technicalKeywordBank } from "./ats-scoring.service.js";

const knownSkills = technicalKeywordBank;

type ParserResult = {
  text: string;
  parser: "plain-text" | "pdf-fallback" | "docx-fallback" | "binary-fallback";
  quality: "high" | "fallback";
  warnings: string[];
  wordCount: number;
};

async function parsePlainText(filePath: string): Promise<ParserResult> {
  const buffer = await fs.readFile(filePath);
  const text = cleanText(buffer.toString("utf8"));
  return { text, parser: "plain-text", quality: "high", warnings: [], wordCount: countWords(text) };
}

async function parseBinaryFallback(filePath: string, parser: ParserResult["parser"], warning: string): Promise<ParserResult> {
  const buffer = await fs.readFile(filePath);
  const rough = buffer.toString("latin1").replace(/[^\x20-\x7E\n]/g, " ");
  const words = rough.split(/\s+/).filter((word) => word.length > 2 && word.length < 40);
  const text = cleanText(words.slice(0, 1_200).join(" ") || "Text extraction fallback: upload a TXT resume for highest local parsing accuracy.");
  return {
    text,
    parser,
    quality: "fallback",
    warnings: [warning],
    wordCount: countWords(text)
  };
}

function cleanText(text: string) {
  return text.replace(/\u0000/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function detectFileType(filePath: string, fileType: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (fileType === "text/plain" || ext === ".txt") return "text/plain";
  if (fileType === "application/pdf" || ext === ".pdf") return "application/pdf";
  if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return fileType;
}

export async function extractResumeTextDetailed(filePath: string, fileType: string): Promise<ParserResult> {
  const detectedType = detectFileType(filePath, fileType);
  if (detectedType === "text/plain") return parsePlainText(filePath);
  if (detectedType === "application/pdf") {
    return parseBinaryFallback(filePath, "pdf-fallback", "PDF parsing is using safe local fallback extraction. Add a dedicated PDF parser package for higher production accuracy.");
  }
  if (detectedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return parseBinaryFallback(filePath, "docx-fallback", "DOCX parsing is using safe local fallback extraction. Add a dedicated DOCX parser package for higher production accuracy.");
  }
  return parseBinaryFallback(filePath, "binary-fallback", "Unknown resume file type used fallback extraction.");
}

export async function extractResumeText(filePath: string, fileType: string) {
  const result = await extractResumeTextDetailed(filePath, fileType);
  return result.text;
}

export function parseResumeText(text: string) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = text.match(/(?:\+?\d[\s-]?){10,14}/)?.[0] || "";
  const links = Array.from(text.matchAll(/https?:\/\/[^\s)]+/g)).map((m) => m[0]);
  const skills = knownSkills.filter((skill) => new RegExp("\\b" + skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(text));
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const detectedSections = ["summary", "skills", "experience", "projects", "education", "certifications"].filter((section) => new RegExp("\\b" + section + "\\b", "i").test(text));
  return {
    name: lines[0]?.length < 80 ? lines[0] : "",
    email,
    phone,
    summary: lines.slice(0, 4).join(" "),
    skills,
    experience: lines.filter((line) => /experience|intern|developer/i.test(line)).slice(0, 6),
    projects: lines.filter((line) => /project|clone|app|platform|dashboard/i.test(line)).slice(0, 8),
    education: lines.filter((line) => /bca|b.tech|degree|college|university|school/i.test(line)).slice(0, 6),
    certifications: lines.filter((line) => /certificate|certification/i.test(line)).slice(0, 5),
    links,
    detectedSections,
    wordCount: countWords(text)
  };
}
