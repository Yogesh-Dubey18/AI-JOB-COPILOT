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

export function parseResumeText(text: string, userFullName?: string, userProfile?: { email?: string; phone?: string }) {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const nonDbLines = lines.filter(Boolean);
  
  // 1. Name: Extract looking for the FIRST non-empty line of the resume
  // that is NOT an email, phone, or URL
  let name = "";
  const emailPattern = /[\w.-]+@[\w.-]+\.\w{2,}/i;
  const phonePattern = /(?:\+?\d[\s-]?){10,14}/;
  const nameUrlPattern = /https?:\/\/[^\s)]+|github\.com|linkedin\.com/i;
  
  for (const line of nonDbLines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    
    const hasEmail = emailPattern.test(cleanLine);
    const hasPhone = phonePattern.test(cleanLine) || cleanLine.match(/\d{4,}/) !== null;
    const hasUrl = nameUrlPattern.test(cleanLine);
    const isSectionHeader = /^(summary|objective|skills|projects|experience|employment|education|certifications|achievements)\b/i.test(cleanLine);
    
    if (!hasEmail && !hasPhone && !hasUrl && !isSectionHeader && cleanLine.length < 50) {
      let parsedName = cleanLine;
      const commaIndex = parsedName.indexOf(",");
      if (commaIndex !== -1) {
        parsedName = parsedName.substring(0, commaIndex);
      }
      const separatorIndex = parsedName.search(/[|•]/);
      if (separatorIndex !== -1) {
        parsedName = parsedName.substring(0, separatorIndex);
      }
      name = parsedName.trim();
      break;
    }
  }

  // Fallback to userFullName if name is not found or empty
  if (!name && userFullName) {
    name = userFullName.trim();
  }
  if (!name || name.toLowerCase() === "candidate") {
    name = userFullName ? userFullName.trim() : "";
  }
  if (!name) {
    name = "Test User";
  }

  // 2. Contact Info
  // Email: regex /[\w.-]+@[\w.-]+\.\w{2,}/
  // Phone (India): regex /(\+91[\s-]?)?[6-9]\d{9}/
  // GitHub: regex /github\.com\/[\w-]+/i
  // LinkedIn: regex /linkedin\.com\/in\/[\w-]+/i
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/i)?.[0] || "";
  const phoneMatch = text.match(/(\+91[\s-]?)?[6-9]\d{9}/)?.[0] || "";
  const githubMatch = text.match(/github\.com\/[\w-]+/i)?.[0] || "";
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i)?.[0] || "";
  
  let email = emailMatch;
  let phone = phoneMatch;
  
  // As fallback: pull email from users collection and phone from user profile if stored
  if (!email && userProfile?.email) {
    email = userProfile.email;
  }
  if (!phone && userProfile?.phone) {
    phone = userProfile.phone;
  }
  
  let location = "";
  const locationMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*(UP|Uttar\s+Pradesh|Delhi|New\s+Delhi|Haryana|Karnataka|Maharashtra|India)\b/i);
  if (locationMatch) {
    location = locationMatch[0].trim();
  } else {
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

  // Group lines into sections
  type SectionName = "summary" | "skills" | "projects" | "experience" | "education" | "certifications" | "none";
  let currentSection: SectionName = "none";
  const sections: Record<SectionName, string[]> = {
    summary: [],
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
    none: []
  };

  const headerPatterns: { name: SectionName; regex: RegExp }[] = [
    { name: "summary", regex: /^(?:professional\s+)?summary\b/i },
    { name: "summary", regex: /^(?:career\s+)?objective\b/i },
    { name: "summary", regex: /^about(?:\s+me)?\b/i },
    { name: "skills", regex: /^(?:technical\s+)?skills\b/i },
    { name: "projects", regex: /^(?:academic\s+)?projects\b/i },
    { name: "experience", regex: /^(?:work\s+|professional\s+)?experience\b/i },
    { name: "experience", regex: /^employment\b/i },
    { name: "experience", regex: /^work\s+history\b/i },
    { name: "education", regex: /^education\b/i },
    { name: "education", regex: /^academic\s+background\b/i },
    { name: "certifications", regex: /^certifications?\b/i },
    { name: "certifications", regex: /^certificates?\b/i },
    { name: "certifications", regex: /^achievements?\b/i }
  ];

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    let matchedSection: SectionName | null = null;
    let remainingText = cleanLine;

    for (const pattern of headerPatterns) {
      const match = cleanLine.match(pattern.regex);
      if (match) {
        matchedSection = pattern.name;
        remainingText = cleanLine.substring(match[0].length).trim();
        remainingText = remainingText.replace(/^[:\-\s•|·]+/, "").trim();
        break;
      }
    }

    if (matchedSection) {
      currentSection = matchedSection;
      if (remainingText) {
        sections[currentSection].push(remainingText);
      }
    } else {
      if (currentSection !== "none") {
        sections[currentSection].push(cleanLine);
      }
    }
  }

  // 3. Process Summary
  let summaryText = sections.summary.join(" ")
    .replace(/[·%!•]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (summaryText.includes("@") || summaryText.match(/\d{10}/)) {
    summaryText = "";
  }

  // 4. Process Skills
  const allSkillsText = sections.skills.join(" ");
  const skills = knownSkills.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("\\b" + escaped + "\\b", "i").test(allSkillsText);
  });

  // 5. Process Projects
  const projects: any[] = [];
  let currentProject: any = null;

  for (const line of sections.projects) {
    const isBullet = line.startsWith("-") || line.startsWith("•") || line.startsWith("*");
    let bulletText = line.replace(/^[-•*]\s*/, "").trim();
    bulletText = bulletText.replace(/%¸/g, "").replace(/demonstrating hands-on implementation/gi, "").replace(/from the uploaded resume/gi, "").trim();

    if (!isBullet && line.length < 100 && (line.includes("|") || line.includes("-") || /^[A-Z]/.test(line))) {
      if (currentProject) {
        projects.push(currentProject);
      }
      
      let namePart = line;
      let techPart = "";
      if (line.includes("|")) {
        const parts = line.split("|");
        namePart = parts[0].trim();
        techPart = parts[1].trim();
      } else if (line.includes("-") && !line.includes(" - ")) {
        const parts = line.split("-");
        namePart = parts[0].trim();
        techPart = parts[1].trim();
      }
      
      currentProject = {
        name: namePart.replace(/%¸/g, "").trim(),
        technologies: techPart.replace(/%¸/g, "").trim(),
        bullets: []
      };
    } else if (currentProject && bulletText) {
      currentProject.bullets.push(bulletText);
    }
  }
  if (currentProject) {
    projects.push(currentProject);
  }

  const finalProjects = projects.map(p => {
    if (p.bullets.length === 0) {
      if (p.name.length > 40) {
        const desc = p.name;
        const words = p.name.split(" ");
        p.name = words.slice(0, 4).join(" ");
        p.bullets.push(desc);
      } else {
        p.bullets.push(p.name);
      }
    }
    return p;
  }).filter(p => p.name);

  // 6. Process Experience
  const experience: any[] = [];
  let currentExp: any = null;

  for (const line of sections.experience) {
    const isBullet = line.startsWith("-") || line.startsWith("•") || line.startsWith("*");
    let bulletText = line.replace(/^[-•*]\s*/, "").trim();

    if (!isBullet && line.length < 100 && (line.includes("|") || line.includes("-") || line.match(/\b(19|20)\d{2}\b/))) {
      if (currentExp) {
        experience.push(currentExp);
      }
      
      let titlePart = line;
      let companyPart = "";
      let durationPart = "";
      
      if (line.includes("|")) {
        const parts = line.split("|");
        titlePart = parts[0].trim();
        companyPart = parts[1]?.trim() || "";
        durationPart = parts[2]?.trim() || "";
      }
      
      currentExp = {
        title: titlePart.trim(),
        company: companyPart.trim(),
        duration: durationPart.trim(),
        bullets: []
      };
    } else if (currentExp && bulletText) {
      currentExp.bullets.push(bulletText);
    }
  }
  if (currentExp) {
    experience.push(currentExp);
  }
  
  const finalExperience = experience.filter(exp => {
    const hasCompany = exp.company && exp.company.length > 2;
    const hasDuration = exp.duration && exp.duration.length > 2;
    return hasCompany && hasDuration && exp.bullets.length > 0;
  });

  // 7. Process Education
  const education: any[] = [];
  for (const line of sections.education) {
    if (line.toLowerCase().includes("degree") || line.toLowerCase().includes("bca") || line.toLowerCase().includes("b.c.a") || line.toLowerCase().includes("b.tech") || line.toLowerCase().includes("bachelor") || line.toLowerCase().includes("school") || line.toLowerCase().includes("college")) {
      let degree = "";
      if (line.match(/b\.?c\.?a/i)) degree = "BCA — Bachelor of Computer Applications";
      else if (line.match(/b\.?tech/i)) degree = "B.Tech — Bachelor of Technology";
      else degree = line.split(/[|-]/)[0].trim();

      let college = "";
      if (line.includes("|")) {
        college = line.split("|")[0].trim();
      } else {
        college = line;
      }

      const yearMatch = line.match(/\b(20\d{2})[-–](20\d{2})\b/) || line.match(/\b(20\d{2})\b/);
      const year = yearMatch ? yearMatch[0] : "";

      const cgpaMatch = line.match(/cgpa[:\s]*(\d\.\d+)/i) || line.match(/gpa[:\s]*(\d\.\d+)/i);
      const cgpa = cgpaMatch ? cgpaMatch[1] : "";

      education.push({
        degree,
        college: college.replace(degree, "").replace(/[|-]/g, "").trim(),
        year,
        cgpa
      });
    }
  }

  // 8. Process Certifications
  const certifications = sections.certifications.map(line => line.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);

  const detectedSections = Object.keys(sections).filter(sec => sections[sec as SectionName].length > 0);

  return {
    name,
    email,
    phone,
    github: githubMatch,
    linkedin: linkedinMatch,
    location,
    summary: summaryText,
    skills,
    experience: finalExperience,
    projects: finalProjects,
    education,
    certifications,
    links: Array.from(text.matchAll(urlPattern)).map((m) => m[0]),
    detectedSections,
    wordCount: countWords(text)
  };
}
