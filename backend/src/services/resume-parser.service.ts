import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import fs from "fs";
import path from "node:path";
import { technicalKeywordBank } from "./ats-scoring.service.js";

async function pdfParse(dataBuffer: Buffer) {
  const uint8 = new Uint8Array(dataBuffer);
  const parser = new PDFParse(uint8);
  return parser.getText();
}

const knownSkills = technicalKeywordBank;

type ParserResult = {
  text: string;
  parser: "plain-text" | "pdf-fallback" | "docx-fallback" | "binary-fallback";
  quality: "high" | "fallback";
  warnings: string[];
  wordCount: number;
};

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?:\+?\d[\s-]?){10,14}/g;
const urlPattern = /https?:\/\/[^\s)]+/g;

async function parsePlainText(filePath: string): Promise<ParserResult> {
  const buffer = await fs.promises.readFile(filePath);
  const text = cleanText(buffer.toString("utf8"));
  return { text, parser: "plain-text", quality: "high", warnings: [], wordCount: countWords(text) };
}

async function parseBinaryFallback(filePath: string, parser: ParserResult["parser"], warning: string): Promise<ParserResult> {
  const buffer = await fs.promises.readFile(filePath);
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redactText(text: string, parsedData: any = {}) {
  const redactedFields = new Set<string>();
  let redacted = text;
  if (parsedData.name) {
    redacted = redacted.replace(new RegExp("\\b" + escapeRegExp(parsedData.name) + "\\b", "gi"), () => {
      redactedFields.add("name");
      return "[redacted-name]";
    });
  }
  redacted = redacted.replace(emailPattern, () => {
    redactedFields.add("email");
    return "[redacted-email]";
  });
  redacted = redacted.replace(phonePattern, () => {
    redactedFields.add("phone");
    return "[redacted-phone]";
  });
  redacted = redacted.replace(urlPattern, () => {
    redactedFields.add("links");
    return "[redacted-link]";
  });
  return { text: redacted, redactedFields: Array.from(redactedFields) };
}

export function anonymizeParsedResume(parsedData: any = {}, rawText = "") {
  const redacted = redactText(rawText, parsedData);
  const redactedFields = new Set(redacted.redactedFields);
  const anonymized = {
    ...parsedData,
    name: parsedData.name ? "[redacted-name]" : "",
    email: parsedData.email ? "[redacted-email]" : "",
    phone: parsedData.phone ? "[redacted-phone]" : "",
    links: Array.isArray(parsedData.links) ? parsedData.links.map(() => "[redacted-link]") : [],
    summary: redactText(parsedData.summary || "", parsedData).text,
    redactedFields: Array.from(redactedFields)
  };
  if (parsedData.name) redactedFields.add("name");
  if (parsedData.email) redactedFields.add("email");
  if (parsedData.phone) redactedFields.add("phone");
  if (Array.isArray(parsedData.links) && parsedData.links.length) redactedFields.add("links");
  anonymized.redactedFields = Array.from(redactedFields);
  return { rawText: redacted.text, parsedData: anonymized, redactedFields: anonymized.redactedFields };
}

export function anonymizeResumeRecord<T extends Record<string, any>>(resume: T) {
  const anonymized = anonymizeParsedResume(resume?.parsedData || {}, resume?.rawText || "");
  return {
    ...resume,
    rawText: anonymized.rawText,
    parsedData: anonymized.parsedData
  };
}

async function parsePdfText(filePath: string): Promise<ParserResult> {
  try {
    const buffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;
    const text = cleanText(extractedText);
    return {
      text,
      parser: "plain-text",
      quality: "high",
      warnings: [],
      wordCount: countWords(text)
    };
  } catch (err) {
    return parseBinaryFallback(
      filePath,
      "pdf-fallback",
      "PDF parser failed. Safe local fallback extraction was used."
    );
  }
}

async function parseDocxText(filePath: string): Promise<ParserResult> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const extractedText = result.value;
    const text = cleanText(extractedText);
    const warnings = result.messages.map((m) => m.message);
    return {
      text,
      parser: "docx-fallback",
      quality: "high",
      warnings,
      wordCount: countWords(text)
    };
  } catch (err: any) {
    return parseBinaryFallback(
      filePath,
      "docx-fallback",
      `DOCX parser failed: ${err.message}. Safe local fallback extraction was used.`
    );
  }
}

export async function extractResumeTextDetailed(filePath: string, fileType: string): Promise<ParserResult> {
  const detectedType = detectFileType(filePath, fileType);
  if (detectedType === "text/plain") return parsePlainText(filePath);
  if (detectedType === "application/pdf") {
    return parsePdfText(filePath);
  }
  if (detectedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return parseDocxText(filePath);
  }
  return parseBinaryFallback(filePath, "binary-fallback", "Unknown resume file type used fallback extraction.");
}

export async function extractResumeText(filePath: string, fileType: string) {
  const result = await extractResumeTextDetailed(filePath, fileType);
  return result.text;
}

export function parseResumeText(text: string) {
  const email = text.match(emailPattern)?.[0] || "";
  const phone = text.match(phonePattern)?.[0] || "";
  const links = Array.from(text.matchAll(urlPattern)).map((m) => m[0]);
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
