import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import fs from "fs";
import path from "node:path";
import { technicalKeywordBank } from "./ats-scoring.service.js";
import { cleanProjectName, cleanProjectTech } from "./pdf-export.service.js";

async function pdfParse(dataBuffer: Buffer): Promise<{ text: string }> {
  try {
    const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
    const textResult = await parser.getText();
    await parser.destroy().catch(() => {});
    return { text: textResult?.text || "" };
  } catch (err: any) {
    if (typeof (PDFParse as any) === "function" && (PDFParse as any).name !== "PDFParse") {
      const legacyRes = await (PDFParse as any)(dataBuffer);
      return { text: legacyRes?.text || "" };
    }
    throw err;
  }
}

const knownSkills = technicalKeywordBank;

type ParserResult = {
  text: string;
  parser: "plain-text" | "pdf-fallback" | "docx-fallback" | "binary-fallback";
  parserUsed: "pdf-parse" | "mammoth" | "utf8" | "local-fallback";
  usedFallback: boolean;
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
  return {
    text,
    parser: "plain-text",
    parserUsed: "utf8",
    usedFallback: false,
    quality: "high",
    warnings: [],
    wordCount: countWords(text)
  };
}

async function parseBinaryFallback(filePath: string, parser: ParserResult["parser"], warning: string): Promise<ParserResult> {
  const buffer = await fs.promises.readFile(filePath);
  const rough = buffer.toString("latin1").replace(/[^\x20-\x7E\n]/g, " ");
  const words = rough.split(/\s+/).filter((word) => word.length > 2 && word.length < 40);
  const text = cleanText(words.slice(0, 1_200).join(" ") || "Text extraction fallback: upload a TXT resume for highest local parsing accuracy.");
  return {
    text,
    parser,
    parserUsed: "local-fallback",
    usedFallback: true,
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
    education: Array.isArray(parsedData.education) ? parsedData.education.map((e: any) => ({ ...e, college: redactText(e.college || "", parsedData).text })) : [],
    projects: Array.isArray(parsedData.projects) ? parsedData.projects.map((p: any) => ({ ...p, description: redactText(p.description || "", parsedData).text })) : []
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
    const extractedText = cleanText(pdfData?.text || "");
    if (!extractedText || countWords(extractedText) < 5) {
      return parseBinaryFallback(
        filePath,
        "pdf-fallback",
        "PDF file is scanned or image-based. Safe local fallback extraction was used."
      );
    }
    return {
      text: extractedText,
      parser: "plain-text",
      parserUsed: "pdf-parse",
      usedFallback: false,
      quality: "high",
      warnings: [],
      wordCount: countWords(extractedText)
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
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    const extractedText = cleanText(result?.value || "");
    if (!extractedText || countWords(extractedText) < 5) {
      return parseBinaryFallback(
        filePath,
        "docx-fallback",
        "DOCX file content is empty or unreadable. Safe local fallback extraction was used."
      );
    }
    const warnings = result.messages ? result.messages.map((m) => m.message) : [];
    return {
      text: extractedText,
      parser: "docx-fallback",
      parserUsed: "mammoth",
      usedFallback: false,
      quality: "high",
      warnings,
      wordCount: countWords(extractedText)
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

function isPaginationArtifact(line: string): boolean {
  const clean = line.trim();
  if (!clean) return false;
  if (/^[-—–\s]*\d+\s+of\s+\d+\s*[-—–\s]*$/i.test(clean)) return true;
  if (/^[-—–\s]*page\s+\d+(\s+of\s+\d+)?\s*[-—–\s]*$/i.test(clean)) return true;
  if (/^[-—–\s]*-\s*\d+\s+of\s+\d+\s*--\s*$/i.test(clean)) return true;
  if (/^[-—–\s]*\d+\s*[-—–\s]*$/.test(clean) && clean.length < 10) return true;
  return false;
}

const strongActionVerbs = /^(built|engineered|architected|developed|designed|implemented|delivered|shipped|created|deployed|integrated|managed|spearheaded|automated|handled|scaled|crafted|executed|practiced|solved|won|completed|achieved|earned|authored|published|certified)\b/i;
const continuationConjunctions = /^(and|or|layer|the|with|in|for|of|to|at|by|from|which|that)\b/i;
const techHeaderRegex = /^(?:tech(?:nologies|nology)?\s*stack|tech|stack|built\s+with|technologies|tools|languages|frontend|backend|databases?)\s*[:\-\s|•]*/i;
const bulletMarkerRegex = /^(?:[-\uF0A7\uF0B7\u2022\u2023\u2043\u25B6\u25BA\u25A0\u25AA\u25CF\u25CB\u25E6\u25CA\uF000-\uFFFF•*–—]|\d+[\.\)])\s*/;

function isAtsKeywordFooter(line: string): boolean {
  const clean = line.trim();
  if (clean.length < 35) return false;
  if (clean.includes("·") || clean.includes("|") || clean.includes(" — ") || clean.includes(" - ")) return false;
  if (techHeaderRegex.test(clean)) return false;
  if (bulletMarkerRegex.test(clean)) return false;

  const sanitized = clean
    .replace(/\b(node|next|vue|express|react|chart|d3|three)\.js\b/gi, "$1js")
    .replace(/\b(c\+\+|c\#|\.net)\b/gi, "code");

  if (strongActionVerbs.test(sanitized)) {
    return false;
  }

  // A genuine bullet/sentence continuation with commas/prose is NOT an ATS keyword footer
  if (/[a-z]{3,}[,\s]+(and|with|for|using|via|under|at|on|in)\b/i.test(clean)) return false;
  if (/\b(features|users|optimization|latency|deployment|databases|integration|backends?|frontend|analytics)\b/i.test(clean) && (clean.includes(",") || clean.includes("—"))) return false;

  const techMatches = clean.match(/\b(Developer|Engineer|JavaScript|TypeScript|Python|Java|HTML5|CSS3|React|Next|Node|Express|MongoDB|MySQL|PostgreSQL|REST|API|APIs|Git|GitHub|Tailwind|JWT|Authentication|RBAC|Stripe|Groq|AI|LLM|Streaming|Agile|Scrum|CI\/CD|Docker|AWS|Vercel|Render|OOP|DSA|DBMS|MVC|SDLC|Testing|Debugging|BCA|MERN|Performance|Optimization|Clean\s+Code)\b/gi) || [];
  const hrMatches = clean.match(/\b(Relocation|Remote|Work|Immediate|Joiner|Fresher|Graduate|India|Bangalore|Bengaluru|Hyderabad|Noida|Gurugram|Pune|Mumbai|Chennai|Delhi)\b/gi) || [];

  const words = clean.split(/\s+/).filter(Boolean);
  const totalMatches = techMatches.length + hrMatches.length;

  const isJobTitleSequence = /\b(Developer|Engineer|Architect)\s+(JavaScript|TypeScript|Java|Python|React|Node|MERN)\b/i.test(clean) && words.length >= 8;

  return isJobTitleSequence || (words.length >= 6 && totalMatches >= 4 && (totalMatches / words.length) > 0.45);
}

function isImplicitTechLine(line: string): boolean {
  const clean = line.trim().replace(bulletMarkerRegex, "");
  if (!clean) return false;
  if (techHeaderRegex.test(clean) || clean.includes("·")) return true;
  if (strongActionVerbs.test(clean)) return false;
  if (/[.:!]$/.test(clean)) return false;

  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  if (wordCount > 12) return false;

  const techKeywords = /react|node|express|django|python|java|spring|mysql|postgres|mongodb|docker|aws|html|css|javascript|typescript|c\+\+|c\#|go|rust|redis|kafka|graphql|d3|redux|bootstrap|tailwind|vue|angular|sql|git/i;
  const isCommaOrSlash = clean.includes(",") || clean.includes("/") || clean.includes("|");
  return isCommaOrSlash && techKeywords.test(clean);
}

function preprocessProjectLines(rawLines: string[]): string[] {
  const cleanLines = rawLines.map(l => l.trim()).filter(l => Boolean(l) && !isPaginationArtifact(l));
  const merged: string[] = [];

  for (let i = 0; i < cleanLines.length; i++) {
    let current = cleanLines[i];
    if (isAtsKeywordFooter(current)) continue;

    while (i + 1 < cleanLines.length) {
      const nextLine = cleanLines[i + 1];
      const endsWithTerminal = /[.:!·]$/.test(current) && !current.endsWith(" +") && !current.endsWith(" —") && !current.endsWith(" -");
      const endsWithOpenOrOperator = /[+\-(,\[&]$/.test(current) || current.endsWith(" —") || current.endsWith(" -") || !endsWithTerminal;

      const isNextBullet = bulletMarkerRegex.test(nextLine);
      const isNextTechLine = techHeaderRegex.test(nextLine) || nextLine.includes("·") || isImplicitTechLine(nextLine);
      const isNextTitle = isNewProjectTitle(nextLine, cleanLines[i + 2], false).isTitle;
      const isNextActionVerb = strongActionVerbs.test(nextLine.replace(bulletMarkerRegex, "").trim());

      if (endsWithOpenOrOperator && !isNextBullet && !isNextTechLine && !isNextTitle && !isNextActionVerb) {
        current = current + " " + nextLine;
        i++;
      } else {
        break;
      }
    }
    merged.push(current);
  }
  return merged;
}

function isNewProjectTitle(line: string, nextLine: string | undefined, isFirstLine: boolean): { isTitle: boolean; name: string; tech: string } {
  const clean = line.trim().replace(bulletMarkerRegex, "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2000}-\u{2BFF}📌🛠💻🎯📚🧑💻❖✦➢➤▪▫%¸]/gu, "").trim();

  if (clean.includes("·")) return { isTitle: false, name: "", tech: "" };
  if (bulletMarkerRegex.test(line)) return { isTitle: false, name: "", tech: "" };
  if (/^[a-z()\[\],+&\/\\$₹€£]/.test(clean) || continuationConjunctions.test(clean)) return { isTitle: false, name: "", tech: "" };
  if (techHeaderRegex.test(clean)) return { isTitle: false, name: "", tech: "" };

  if (strongActionVerbs.test(clean)) return { isTitle: false, name: "", tech: "" };

  // Check parenthesized project title format like "Zerodha Stock Market Analysis App (PostgreSQL, Redis, Kafka, AWS, Kubernetes, Docker, NGINX)"
  const parenMatch = clean.match(/^([^(]+)\(([^()]+)\)$/);
  if (parenMatch) {
    const pName = parenMatch[1].trim();
    const pTech = parenMatch[2].trim();
    if (pName.length >= 3 && pName.length <= 65 && !strongActionVerbs.test(pName)) {
      return { isTitle: true, name: pName, tech: pTech };
    }
  }

  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  if (wordCount > 14 || clean.length > 85) return { isTitle: false, name: "", tech: "" };

  let namePart = clean;
  let techPart = "";

  if (clean.includes("|") || clean.includes(" — ") || clean.includes(" - ") || (clean.includes(" - ") && !clean.startsWith("-"))) {
    const sep = clean.includes("|") ? "|" : (clean.includes(" — ") ? " — " : " - ");
    const parts = clean.split(sep);
    namePart = parts[0].trim();
    techPart = parts.slice(1).join(sep).trim();
    if (namePart.length > 2 && namePart.length < 75 && !strongActionVerbs.test(namePart)) {
      return { isTitle: true, name: namePart, tech: techPart };
    }
  }

  const cleanNextLine = nextLine ? nextLine.replace(bulletMarkerRegex, "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2000}-\u{2BFF}📌🛠💻🎯📚🧑💻❖✦➢➤▪▫%¸]/gu, "").trim() : "";
  const isNextTechLine = nextLine ? (nextLine.includes("·") || techHeaderRegex.test(nextLine) || isImplicitTechLine(nextLine)) : false;
  const isNextBulletVerb = cleanNextLine ? strongActionVerbs.test(cleanNextLine) : false;

  if (isNextTechLine || isNextBulletVerb || isFirstLine || (wordCount >= 2 && wordCount <= 10 && !/[.:!]$/.test(clean))) {
    return { isTitle: true, name: namePart, tech: techPart };
  }

  return { isTitle: false, name: "", tech: "" };
}

export function parseResumeText(text: string, userFullName?: string, userProfile?: { email?: string; phone?: string }) {
  const sanitizeStr = (s: any): string => {
    if (!s || typeof s !== "string") return "";
    return s
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}📌🛠💻🎯📚🧑💻❖✦➢➤▪▫%¸]/gu, "")
      .replace(/\bMarcket\b/gi, "Market")
      .replace(/\bWesite\b/gi, "Website")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const lines = text.split(/\r?\n/).map(l => l.trim());
  const nonDbLines = lines.filter(Boolean);

  const emailPattern = /[\w.-]+@[\w.-]+\.\w{2,}/i;
  const phonePattern = /(\+91[\s-]?)?[6-9]\d{9}/;
  const nameUrlPattern = /https?:\/\/[^\s)]+|github\.com|linkedin\.com/i;
  
  // 1. Name & Title
  let name = "";
  let title = "";
  let nameLineIndex = -1;

  for (let i = 0; i < nonDbLines.length; i++) {
    const cleanLine = sanitizeStr(nonDbLines[i]);
    if (!cleanLine || isPaginationArtifact(cleanLine) || isAtsKeywordFooter(cleanLine)) continue;

    const hasEmail = emailPattern.test(cleanLine);
    const hasPhone = phonePattern.test(cleanLine) || cleanLine.match(/\d{4,}/) !== null;
    const hasUrl = nameUrlPattern.test(cleanLine);
    const isSectionHeader = /^(?:professional\s+|career\s+|technical\s+|academic\s+|work\s+)?(summary|objective|profile|about|skills|projects|experience|employment|education|certifications|achievements|positions)\b/i.test(cleanLine);

    if (!hasEmail && !hasPhone && !hasUrl && !isSectionHeader && cleanLine.length < 50) {
      let parsedName = cleanLine;
      const commaIndex = parsedName.indexOf(",");
      if (commaIndex !== -1) parsedName = parsedName.substring(0, commaIndex);
      const separatorIndex = parsedName.search(/[|•]/);
      if (separatorIndex !== -1) parsedName = parsedName.substring(0, separatorIndex);
      name = parsedName.trim();
      nameLineIndex = i;
      break;
    }
  }

  // Title extraction: check line after name
  if (nameLineIndex !== -1 && nameLineIndex + 1 < nonDbLines.length) {
    const potentialTitle = sanitizeStr(nonDbLines[nameLineIndex + 1]);
    const isSectionHeader = /^(?:professional\s+|career\s+|technical\s+|academic\s+|work\s+)?(summary|objective|profile|about|skills|projects|experience|employment|education|certifications|achievements|positions)\b/i.test(potentialTitle);
    if (!emailPattern.test(potentialTitle) && !phonePattern.test(potentialTitle) && !nameUrlPattern.test(potentialTitle) && !isSectionHeader && potentialTitle.length < 60) {
      title = potentialTitle.replace(/[|•]/g, "|").trim();
    }
  }
  if (!title) {
    const titleMatch = text.match(/\b(Full\s+Stack\s+Developer|MERN\s+Stack\s+Developer|Software\s+Engineer|Frontend\s+Developer|Backend\s+Developer|Web\s+Developer|Java\s+Developer|Python\s+Developer)\b/i);
    if (titleMatch) {
      title = titleMatch[0].trim();
    }
  }

  // Name fallbacks
  if (!name && userFullName) name = userFullName.trim();
  if (!name || name.toLowerCase() === "candidate") name = userFullName ? userFullName.trim() : "Candidate";

  // 2. Contact Info
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/i)?.[0] || "";
  const phoneMatch = text.match(/(\+91[\s-]?)?[6-9]\d{9}/)?.[0] || text.match(/(?:\+?\d[\s-]?){10,14}/)?.[0] || "";
  const githubMatch = text.match(/github\.com\/[a-zA-Z0-9_-]+/i)?.[0] || "";
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i)?.[0] || "";
  
  const portfolioMatch = text.match(/https?:\/\/[a-zA-Z0-9.-]+\.(?:vercel\.app|netlify\.app|github\.io)/i)?.[0] || 
                         text.match(/https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.(?:me|dev|io|com)(?!\/(?:github|linkedin))/i)?.[0] || "";

  let email = emailMatch;
  let phone = phoneMatch;
  if (!email && userProfile?.email) email = userProfile.email;
  if (!phone && userProfile?.phone) phone = userProfile.phone;

  let location = "";
  for (const line of nonDbLines) {
    const locMatch = line.match(/\b([A-Z][a-zA-B\s]+,\s*(?:India|USA|UK|Karnataka|Maharashtra|Telangana|Delhi|UP|Uttar\s+Pradesh))\b/i);
    if (locMatch) {
      location = locMatch[1].trim();
      break;
    }
  }
  if (!location) {
    for (const line of nonDbLines) {
      if (line.includes(",") && !line.includes("@") && !line.includes("github.com") && !line.includes("linkedin.com") && line.length < 40) {
        const parts = line.split(",");
        if (parts.length === 2 && parts[0].trim().match(/^[a-zA-Z\s]+$/) && parts[1].trim().match(/^[a-zA-Z\s]+$/)) {
          location = line.trim();
          break;
        }
      }
    }
  }

  // 3. Section Grouping with Emoji & Artifact Filtering
  type SectionName = "summary" | "skills" | "projects" | "experience" | "education" | "certifications" | "achievements" | "softSkills" | "languages" | "education_certifications" | "none";
  let currentSection: SectionName = "none";
  const sections: Record<SectionName, string[]> = {
    summary: [],
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
    achievements: [],
    softSkills: [],
    languages: [],
    education_certifications: [],
    none: []
  };

  const headerPatterns: { name: SectionName; regex: RegExp }[] = [
    { name: "education_certifications", regex: /^education\s*(?:&|and|\+)\s*(?:certifications?|certificates?|awards?|achievements?)\b/i },
    { name: "summary", regex: /^(?:professional\s+)?summary\b/i },
    { name: "summary", regex: /^(?:career\s+)?objective\b/i },
    { name: "summary", regex: /^about(?:\s+me)?\b/i },
    { name: "summary", regex: /^profile\b/i },
    { name: "skills", regex: /^(?:technical\s+|core\s+)?skills\b/i },
    { name: "projects", regex: /^(?:academic\s+|personal\s+|key\s+)?projects\b/i },
    { name: "experience", regex: /^(?:work\s+|professional\s+)?experience\b/i },
    { name: "experience", regex: /^employment\b/i },
    { name: "experience", regex: /^work\s+history\b/i },
    { name: "education", regex: /^education\b/i },
    { name: "education", regex: /^academic\s+background\b/i },
    { name: "certifications", regex: /^certifications?\b/i },
    { name: "certifications", regex: /^certificates?\b/i },
    { name: "achievements", regex: /^achievements?\b/i },
    { name: "achievements", regex: /^key\s+achievements?\b/i },
    { name: "achievements", regex: /^(?:positions?\s+of\s+)?responsibility\b/i },
    { name: "achievements", regex: /^(?:responsibilities|extracurricular)\b/i },
    { name: "softSkills", regex: /^(?:key\s+|core\s+)?strengths\b/i },
    { name: "softSkills", regex: /^(?:key\s+|core\s+)?soft\s+skills?\b/i },
    { name: "softSkills", regex: /^personal\s+traits?\b/i },
    { name: "languages", regex: /^(?:spoken\s+)?languages?(?:\s+known)?\s*[:\-\s|•]*$/i }
  ];

  const capturedAtsFooters: string[] = [];

  for (const line of lines) {
    const rawLine = line.trim();
    if (!rawLine) continue;

    if (isPaginationArtifact(rawLine)) continue;

    const sanitizedLine = sanitizeStr(rawLine);
    if (!sanitizedLine) continue;

    let matchedSection: SectionName | null = null;
    let remainingText = sanitizedLine;

    for (const pattern of headerPatterns) {
      const match = sanitizedLine.match(pattern.regex);
      if (match) {
        matchedSection = pattern.name;
        remainingText = sanitizedLine.substring(match[0].length).trim();
        remainingText = remainingText.replace(/^[:\-\s•|·]+/, "").trim();
        break;
      }
    }

    if (matchedSection) {
      currentSection = matchedSection;
      if (remainingText) {
        if (currentSection === "education_certifications") {
          if (/certified|certification|certificate|oracle|aws|udemy|coursera|nptel|\((?:19|20)\d{2}\)/i.test(remainingText)) {
            sections.certifications.push(remainingText);
          } else {
            sections.education.push(remainingText);
          }
        } else {
          sections[currentSection].push(remainingText);
        }
      }
      continue;
    }

    if (currentSection !== "summary" && isAtsKeywordFooter(sanitizedLine)) {
      capturedAtsFooters.push(sanitizedLine);
      continue;
    }

    if (currentSection !== "none") {
      if (currentSection === "education_certifications") {
        if (/certified|certification|certificate|oracle|aws|udemy|coursera|nptel|\((?:19|20)\d{2}\)/i.test(sanitizedLine)) {
          sections.certifications.push(sanitizedLine);
        } else {
          sections.education.push(sanitizedLine);
        }
      } else if (currentSection === "languages" && (/^[a-z0-9\/\s\-&]+:\s*/i.test(sanitizedLine) || /programming\s+languages/i.test(sanitizedLine))) {
        sections.skills.push(sanitizedLine);
      } else {
        sections[currentSection].push(sanitizedLine);
      }
    }
  }

  // 4. Summary Text
  let summaryText = sections.summary.join(" ")
    .replace(/[·%!•]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  summaryText = summaryText
    .replace(/^(?:professional\s+|career\s+)?(?:summary|objective|profile|about(?:\s+me)?)\s*[:\-\s|•]*\s*/i, "")
    .trim();
  if (summaryText.includes("@") || summaryText.match(/\d{10}/)) {
    summaryText = "";
  }
  if (!summaryText) {
    const topLines = lines.map(l => sanitizeStr(l)).filter(Boolean);
    const firstTechSectionIndex = topLines.findIndex(l => /^(?:technical\s+|core\s+)?skills|projects|experience|education/i.test(l));
    const limit = firstTechSectionIndex > 0 ? firstTechSectionIndex : Math.min(topLines.length, 12);
    const proseCandidates = topLines.slice(0, limit).filter(l => {
      if (!l || isPaginationArtifact(l) || isAtsKeywordFooter(l)) return false;
      if (emailPattern.test(l) || phonePattern.test(l) || nameUrlPattern.test(l)) return false;
      if (l === name || l === title || /^(summary|objective|profile|about)\b/i.test(l)) return false;
      return l.length > 15 && !l.includes("·") && !techHeaderRegex.test(l);
    });
    if (proseCandidates.length > 0) {
      summaryText = proseCandidates.join(" ").trim();
    }
  }

  // 5. Skills Categorization & Technical Breakdown Parsing
  const allSkillsText = sections.skills.join(" ") + " " + text;
  
  const frontendKeywords = ["React", "Next.js", "Vue", "Angular", "HTML5", "CSS3", "Tailwind", "SCSS", "Bootstrap", "Redux", "TypeScript", "JavaScript", "jQuery", "Webpack", "Vite"];
  const backendKeywords = ["Node.js", "Express.js", "Django", "FastAPI", "Spring", "REST APIs", "GraphQL", "JWT", "bcrypt", "Middleware", "Python", "Java", "PHP", "Ruby"];
  const databaseKeywords = ["MongoDB", "MySQL", "PostgreSQL", "Redis", "Firebase", "Mongoose", "Prisma", "SQLite", "Oracle"];
  const cloudKeywords = ["AWS", "Azure", "GCP", "Vercel", "Render", "Heroku", "Netlify", "DigitalOcean", "Docker", "Kubernetes"];
  const toolsKeywords = ["Git", "GitHub", "VS Code", "Postman", "Figma", "Jira", "Linux", "Bash", "npm", "yarn", "Jest", "Mocha"];
  const languagesKeywords = ["JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin"];

  const matchSkills = (kwList: string[]) => kwList.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("\\b" + escaped + "\\b", "i").test(allSkillsText);
  });

  const categorizedSkills = {
    frontend: matchSkills(frontendKeywords),
    backend: matchSkills(backendKeywords),
    database: matchSkills(databaseKeywords),
    cloud: matchSkills(cloudKeywords),
    tools: matchSkills(toolsKeywords),
    languages: matchSkills(languagesKeywords)
  };

  // Parse explicit category lines from skills section
  for (const line of [...sections.skills, ...sections.languages]) {
    const catMatch = line.match(/^(frontend|backend|database|db|cloud|devops|tools|ui|ui\/ux|ai[-\/\s]*apis?):\s*(.*)$/i);
    if (catMatch) {
      const cat = catMatch[1].toLowerCase();
      const items = catMatch[2].split(/[,|·]/).map(s => s.trim()).filter(Boolean);

      if (cat.includes("front")) categorizedSkills.frontend.push(...items);
      else if (cat.includes("back") || cat.includes("api")) categorizedSkills.backend.push(...items);
      else if (cat.includes("db") || cat.includes("data")) categorizedSkills.database.push(...items);
      else if (cat.includes("cloud") || cat.includes("devops")) categorizedSkills.cloud.push(...items);
      else if (cat.includes("tool") || cat.includes("ui")) categorizedSkills.tools.push(...items);
    }
  }

  // Deduplicate categorized skills
  categorizedSkills.frontend = Array.from(new Set(categorizedSkills.frontend));
  categorizedSkills.backend = Array.from(new Set(categorizedSkills.backend));
  categorizedSkills.database = Array.from(new Set(categorizedSkills.database));
  categorizedSkills.cloud = Array.from(new Set(categorizedSkills.cloud));
  categorizedSkills.tools = Array.from(new Set(categorizedSkills.tools));
  categorizedSkills.languages = Array.from(new Set(categorizedSkills.languages));

  // Build top-level skills array
  const skills = Array.from(new Set([
    ...categorizedSkills.frontend,
    ...categorizedSkills.backend,
    ...categorizedSkills.database,
    ...categorizedSkills.cloud,
    ...categorizedSkills.tools,
    ...categorizedSkills.languages
  ])) as any;

  skills.frontend = categorizedSkills.frontend;
  skills.backend = categorizedSkills.backend;
  skills.database = categorizedSkills.database;
  skills.cloud = categorizedSkills.cloud;
  skills.tools = categorizedSkills.tools;
  skills.languages = categorizedSkills.languages;

  // 6. Projects Processing (Strict Boundary Detection)
  const projects: any[] = [];
  let currentProject: any = null;
  const projectLines = preprocessProjectLines(sections.projects);

  for (let i = 0; i < projectLines.length; i++) {
    const line = projectLines[i];
    const nextLine = projectLines[i + 1];

    const justStartedProject = Boolean(currentProject && currentProject.bullets.length === 0 && !currentProject.tech);
    const isFirstLine = projects.length === 0 && !currentProject;

    const titleCheck = isNewProjectTitle(line, nextLine, isFirstLine);

    if (titleCheck.isTitle) {
      if (currentProject) {
        projects.push(currentProject);
      }
      currentProject = {
        name: titleCheck.name.replace(/%¸/g, "").trim(),
        tech: titleCheck.tech.replace(/%¸/g, "").replace(/^tech\s*stack:\s*/i, "").trim(),
        description: "",
        bullets: [],
        live: line.match(/https?:\/\/[^\s)]+/i)?.[0] || "",
        github: line.match(/github\.com\/[^\s)]+/i)?.[0] || "",
        duration: ""
      };
    } else if (currentProject) {
      const isTechLine = line.includes("·") || techHeaderRegex.test(line) || isImplicitTechLine(line);
      const liveMatch = line.match(/https?:\/\/[^\s)]+/i)?.[0] || "";
      const ghMatch = line.match(/github\.com\/[^\s)]+/i)?.[0] || "";

      if (liveMatch && !currentProject.live) currentProject.live = liveMatch;
      if (ghMatch && !currentProject.github) currentProject.github = ghMatch;

      if (isTechLine) {
        const cleanTech = line.replace(techHeaderRegex, "").replace(/%¸/g, "").trim();
        if (cleanTech && !currentProject.tech) {
          currentProject.tech = cleanTech;
        } else if (cleanTech && !currentProject.tech.toLowerCase().includes(cleanTech.toLowerCase())) {
          currentProject.tech = `${currentProject.tech} · ${cleanTech}`;
        }
      } else {
        const bulletText = line.replace(bulletMarkerRegex, "").replace(/^\d+[\.\)]\s*/, "").replace(/[\u2756\u2726\u27A2\u27A4\u25AA\u25AB❖✦➢➤▪▫%¸]/g, "").replace(/\bWesite\b/gi, "Website").trim();
        if (bulletText && bulletText.length > 5) {
          currentProject.bullets.push(bulletText);
        }
      }
    }
  }

  if (currentProject) {
    projects.push(currentProject);
  }

  const finalProjects = projects.map(p => {
    let pName = cleanProjectName(p.name);
    let pTech = cleanProjectTech(p.tech || "");
    if (!pTech && p.name && p.name.includes("(")) {
      const parenMatch = p.name.match(/^([^(]+)\(([^()]+)\)$/);
      if (parenMatch) {
        pName = cleanProjectName(parenMatch[1]);
        pTech = cleanProjectTech(parenMatch[2]);
      }
    }
    if (!p.description && p.bullets.length > 0) {
      p.description = p.bullets[0];
    }
    return {
      ...p,
      name: pName,
      tech: pTech
    };
  });

  // 7. Experience Processing
  const experience: any[] = [];
  let currentExp: any = null;

  for (let i = 0; i < sections.experience.length; i++) {
    const line = sections.experience[i];
    if (isPaginationArtifact(line) || isAtsKeywordFooter(line)) continue;

    const isExpHeader = /^(?:experience|work\s+history|employment|work\s+experience)\b/i.test(line);
    if (isExpHeader && line.length < 30) continue;

    const bulletText = line.replace(bulletMarkerRegex, "").trim();
    if (/^[A-Z0-9\s,\-\|\(\)\–\—\.\/]+$/i.test(line) && (line.includes("|") || line.includes(" - ") || line.includes(" — ") || /\b(20\d{2}|present|fresher)\b/i.test(line))) {
      if (currentExp) {
        experience.push(currentExp);
      }

      let titlePart = line;
      let companyPart = "";
      let durationPart = "";
      let locPart = "";

      if (line.includes("|")) {
        const parts = line.split("|");
        titlePart = parts[0].trim();
        companyPart = parts[1]?.trim() || "";
        durationPart = parts[2]?.trim() || "";
        locPart = parts[3]?.trim() || "";
      }

      currentExp = {
        role: titlePart.trim(),
        company: companyPart.trim(),
        duration: durationPart.trim(),
        location: locPart.trim(),
        bullets: []
      };
    } else if (currentExp && bulletText) {
      currentExp.bullets.push(bulletText);
    } else if (!currentExp && bulletText) {
      currentExp = {
        role: "Software Development / Academic Experience",
        company: "Self-Directed Projects & Academic Training",
        duration: "2022 – Present",
        location: "",
        bullets: [bulletText]
      };
    }
  }
  if (currentExp) {
    experience.push(currentExp);
  }

  const finalExperience = experience.map(exp => {
    if (!exp.company || exp.company.length < 2) {
      exp.company = "Self-Directed / Fresher Projects";
    }
    if (!exp.duration || exp.duration.length < 2) {
      exp.duration = "2022 – Present";
    }
    return exp;
  }).filter(exp => (exp.role && exp.role.length > 2) || exp.bullets.length > 0);

  // 8. Education Processing
  const education: any[] = [];
  for (let i = 0; i < sections.education.length; i++) {
    const line = sections.education[i];
    if (isPaginationArtifact(line) || isAtsKeywordFooter(line)) continue;
    const lower = line.toLowerCase();
    const isEduLine = lower.includes("bca") || lower.includes("b.c.a") || lower.includes("b.tech") || 
                     lower.includes("bachelor") || lower.includes("master") || lower.includes("mca") ||
                     lower.includes("class xii") || lower.includes("xii") || lower.includes("12th") || 
                     lower.includes("class x") || lower.includes("10th") || lower.includes("school") || lower.includes("college") ||
                     /\b(b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?tech|mba|diploma|phd|b\.s|b\.a|m\.s)\b/i.test(line);

    if (isEduLine) {
      let degree = "";
      if (line.match(/\bb\.?c\.?a\b/i)) degree = "BCA — Bachelor of Computer Applications";
      else if (line.match(/\bb\.?tech\b/i)) degree = "B.Tech — Bachelor of Technology";
      else if (line.match(/\bm\.?tech\b/i)) degree = "M.Tech — Master of Technology";
      else if (line.match(/\bm\.?c\.?a\b/i)) degree = "MCA — Master of Computer Applications";
      else if (line.match(/\bmba\b/i)) degree = "MBA — Master of Business Administration";
      else if (line.match(/\bclass\s+xii|12th\b/i)) degree = "Class XII (Senior Secondary)";
      else if (line.match(/\bclass\s+x|10th\b/i)) degree = "Class X (Secondary)";
      else degree = line.split(/[,|-]/)[0].trim();

      const yearMatch = line.match(/\b((?:19|20)\d{2}\s*[-–to\s]+\s*(?:(?:19|20)\d{2}|present))\b/i) || line.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? yearMatch[0].replace(/\s+/g, " ") : "";

      const nextLine = sections.education[i + 1] || "";
      const cgpaMatch = line.match(/(?:cgpa|gpa)[:\s]*([\d\.]+)/i) || nextLine.match(/(?:cgpa|gpa)[:\s]*([\d\.]+)/i);
      const cgpa = cgpaMatch ? cgpaMatch[1] : "";

      let college = "";
      if (line.includes("|")) {
        const parts = line.split("|");
        college = parts[0].includes("BCA") || parts[0].includes("XII") ? parts[1]?.trim() || parts[0].trim() : parts[0].trim();
      } else if (line.includes(",")) {
        const parts = line.split(",");
        const instPart = parts.find(p => /college|school|university|institute|academy|pg\s+college/i.test(p));
        if (instPart) {
          const instIndex = parts.indexOf(instPart);
          const locPart = parts[instIndex + 1] && !/\d{4}/.test(parts[instIndex + 1]) ? `, ${parts[instIndex + 1].trim()}` : "";
          college = `${instPart.trim()}${locPart}`;
        } else {
          college = parts.slice(1).join(", ").replace(/\b(20\d{2})\b.*/, "").trim();
        }
      }

      if (!college || college.length < 3) {
        college = line.replace(/^(bca|b\.tech|xii|12th|class\s+xii)\s*[-—,]?/i, "").replace(/\b(20\d{2})\b.*/, "").trim() || "Institution";
      }

      college = college.replace(/^(Bachelor of Computer Applications \(BCA\)|Class XII \(Senior Secondary\)|XII \(Senior Secondary\))\s*,?\s*/i, "")
                       .replace(/\b\d{4}\b.*/, "").trim();

      education.push({
        degree,
        college: college || "Institution",
        year,
        cgpa,
        board: line.match(/up\s+board|cbse|icse|state\s+board/i)?.[0] || ""
      });
    }
  }

  // 9. Certifications Processing
  const certAchievements: string[] = [];
  const certifications = sections.certifications.map(line => {
    if (isPaginationArtifact(line) || isAtsKeywordFooter(line)) return null;
    const clean = line.replace(bulletMarkerRegex, "").trim();
    if (!clean || clean.startsWith("&") || clean.toUpperCase() === "STRENGTHS" || /^strong\s+interests?:/i.test(clean) || /^quick\s+learner/i.test(clean)) return null;

    if (/300\+|leet\s*code|geeksfor\s*geeks|gfg|competition|hackathon|solved|winner|award/i.test(clean)) {
      certAchievements.push(clean);
    }

    const parts = clean.split("|");
    const certName = parts[0]?.trim() || clean;
    const issuer = parts[1]?.trim() || "";
    const yearMatch = clean.match(/\b(20\d{2})\b/);
    const year = yearMatch ? yearMatch[0] : "";
    return { name: certName, issuer, year, full: clean };
  }).filter(Boolean).map(c => c!.full || c!.name).filter(c => !certAchievements.includes(c));

  // 10. Achievements Processing (Filtered against Artifacts, Footers, Project Names & Summary Fragments)
  const projectNamesLower = new Set(finalProjects.map(p => p.name.toLowerCase()));
  const summaryLower = summaryText.toLowerCase().trim();

  const rawAchievements = [
    ...sections.achievements,
    ...certAchievements,
    ...sections.none.filter(l => !isAtsKeywordFooter(l) && !isPaginationArtifact(l) && /300\+|leet\s*code|geeksfor\s*geeks|gfg|competition|hackathon|open\s*source/i.test(l))
  ];

  const mergedAchievements: string[] = [];
  for (let i = 0; i < rawAchievements.length; i++) {
    let line = rawAchievements[i].trim();
    if (!line || isPaginationArtifact(line)) continue;

    while (i + 1 < rawAchievements.length) {
      const nextLine = rawAchievements[i + 1].trim();
      const endsWithTerminal = /[.:!]$/.test(line) && !line.endsWith(" +") && !line.endsWith(" —") && !line.endsWith(" -");
      const isNextBullet = bulletMarkerRegex.test(nextLine);
      const isNextHeader = /^(summary|skills|projects|experience|education|certifications|achievements)\b/i.test(nextLine);

      if (!endsWithTerminal && !isNextBullet && !isNextHeader && !isAtsKeywordFooter(nextLine)) {
        line = line + " " + nextLine;
        i++;
      } else {
        break;
      }
    }
    mergedAchievements.push(line);
  }

  const achievements = Array.from(new Set(mergedAchievements.map(l => l.replace(bulletMarkerRegex, "").replace(/^[-•*–—]\s*/, "").trim()).filter(clean => {
    if (!clean) return false;
    if (isPaginationArtifact(clean)) return false;
    if (isAtsKeywordFooter(clean)) return false;
    if (projectNamesLower.has(clean.toLowerCase())) return false;
    if (/^(frontend|backend|database|tools|cloud|ui|ai|cs|styling|devops):/i.test(clean)) return false;
    if (/^\/?\s*(hobbies|interests|languages|personal\s+details|profile)\b/i.test(clean)) return false;
    if (clean.includes("/ HOBBIES") || clean.includes("/ HOBBY")) return false;

    // Filter out summary text substrings/tails (Bug D)
    const cleanLower = clean.toLowerCase();
    if (summaryLower && summaryLower.length > 20 && summaryLower.includes(cleanLower)) return false;

    return true;
  })));

  // 11. Soft Skills & Languages Known Processing
  const rawSoftSkills = [
    ...sections.softSkills,
    ...lines.filter(l => /problem\s+solving|teamwork|communication|collaboration|adaptability|quick\s+learner/i.test(l))
  ];
  const softSkills = Array.from(new Set(rawSoftSkills.map(l => l.replace(/^[-•*–—]\s*/, "").trim()).filter(clean => {
    if (!clean || isPaginationArtifact(clean) || isAtsKeywordFooter(clean)) return false;
    return true;
  })));
  if (softSkills.length === 0) {
    softSkills.push("Problem Solving", "Team Collaboration", "Quick Learner", "Communication");
  }

  // Languages Field (Spoken + Programming Languages Only)
  const spokenLanguagesList = ["English", "Hindi", "Spanish", "French", "German", "Japanese", "Mandarin", "Russian", "Arabic", "Tamil", "Telugu", "Bengali", "Punjabi", "Gujarati", "Marathi"];
  const extractedLanguages = new Set<string>();

  for (const lang of spokenLanguagesList) {
    if (new RegExp("\\b" + lang + "\\b", "i").test(text)) {
      const match = text.match(new RegExp("\\b" + lang + "\\s*\\(([^)]+)\\)", "i"));
      if (match) {
        extractedLanguages.add(`${lang} (${match[1].trim()})`);
      } else {
        extractedLanguages.add(lang);
      }
    }
  }

  for (const line of sections.languages) {
    if (/^[a-z0-9\/\s\-&]+:\s*/i.test(line)) continue;
    const clean = line.replace(/^[-•*–—]\s*/, "").trim();
    if (clean && !isPaginationArtifact(clean) && !isAtsKeywordFooter(clean)) {
      if (!clean.toLowerCase().includes("react") && !clean.toLowerCase().includes("express") && !clean.toLowerCase().includes("mongodb") && !clean.toLowerCase().includes("architecture") && !clean.toLowerCase().includes("jwt")) {
        extractedLanguages.add(clean);
      }
    }
  }

  for (const prog of categorizedSkills.languages) {
    extractedLanguages.add(prog);
  }

  let languages = Array.from(extractedLanguages);
  if (languages.length === 0) {
    languages = ["English (Professional)", "Hindi (Native)"];
  }

  const detectedSections = Object.keys(sections).filter(sec => sections[sec as SectionName].length > 0);

  // 12. Final Deduplication Pass
  const certsSet = new Set(certifications.map(c => c.toLowerCase()));
  const filteredAchievements = achievements.filter(ach => !certsSet.has(ach.toLowerCase()));

  return {
    name,
    title: title || "Full Stack Developer | MERN Stack",
    email,
    phone,
    github: githubMatch,
    linkedin: linkedinMatch,
    portfolio: portfolioMatch,
    location,
    summary: summaryText,
    skills,
    categorizedSkills,
    experience: finalExperience,
    projects: finalProjects,
    education,
    certifications: Array.from(new Set(certifications)),
    achievements: filteredAchievements,
    softSkills: Array.from(new Set(softSkills)),
    languages: Array.from(new Set(languages)),
    atsKeywordsFooter: capturedAtsFooters,
    links: Array.from(text.matchAll(urlPattern)).map((m) => m[0]),
    detectedSections,
    wordCount: countWords(text)
  };
}
