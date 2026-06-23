import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords, findOneRecord } from "../utils/repository.js";
import { uploadFile, getSignedUrl, getProvider } from "./storage.service.js";

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

function categorizeSkills(skills: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    "Frontend": [],
    "Backend": [],
    "Database": [],
    "Tools": []
  };
  
  const frontendKeywords = ["react", "vue", "angular", "html", "css", "next", "tailwind", "typescript", "javascript", "js", "ts", "redux", "jquery", "sass", "bootstrap", "flutter", "swiftui", "webpack"];
  const backendKeywords = ["node", "express", "python", "java", "go", "golang", "c++", "c#", "django", "ruby", "rails", "rust", "php", "nestjs", "graphql", "spring", "flask", "fastapi", "solidity"];
  const databaseKeywords = ["mongodb", "postgresql", "postgres", "mysql", "redis", "sqlite", "oracle", "mariadb", "cassandra", "firebase", "dynamodb", "neo4j", "prisma", "sequelize"];
  const toolsKeywords = ["git", "docker", "kubernetes", "aws", "gcp", "azure", "jenkins", "vite", "npm", "github", "gitlab", "jira", "postman", "linux", "nginx", "ci/cd", "terraform"];

  const other: string[] = [];

  for (const skill of skills) {
    const trimmed = skill.trim();
    if (!trimmed) continue;

    if (trimmed.includes(":")) {
      const parts = trimmed.split(":");
      const cat = parts[0].trim();
      const sks = parts[1].split(",").map(s => s.trim()).filter(Boolean);
      
      let matchedKey = Object.keys(categories).find(
        key => key.toLowerCase() === cat.toLowerCase()
      );
      if (matchedKey) {
        categories[matchedKey].push(...sks);
      } else {
        categories[cat] = sks;
      }
      continue;
    }

    const lower = trimmed.toLowerCase();
    if (frontendKeywords.some(kw => lower.includes(kw))) {
      categories.Frontend.push(trimmed);
    } else if (databaseKeywords.some(kw => lower.includes(kw))) {
      categories.Database.push(trimmed);
    } else if (backendKeywords.some(kw => lower.includes(kw))) {
      categories.Backend.push(trimmed);
    } else if (toolsKeywords.some(kw => lower.includes(kw))) {
      categories.Tools.push(trimmed);
    } else {
      other.push(trimmed);
    }
  }

  if (other.length > 0) {
    if (!categories.Tools) categories.Tools = [];
    categories.Tools.push(...other);
  }

  for (const key of Object.keys(categories)) {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  }

  return categories;
}

const fallbackSummary = "BCA graduate and Full Stack Developer specializing in MERN stack (MongoDB, Express.js, React.js, Node.js) with 4 production projects and DUCAT certification. Solved 300+ DSA problems. Seeking entry-level software developer role.";

const fixedSkillCategories = [
  ["Frontend", "React.js, Next.js, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS"],
  ["Backend", "Node.js, Express.js, REST APIs, JWT Authentication"],
  ["Database", "MongoDB, Mongoose"],
  ["Tools", "Git, GitHub, VS Code, Postman, Vercel, Render"]
] as const;

const fallbackProjects = [
  {
    name: "AI Job Copilot",
    techStack: "Next.js, Express.js, MongoDB, Groq AI",
    bullets: ["Built full-stack AI-powered SaaS career platform with 12 modules including ATS resume scoring, job matching, interview prep, and scam detection. Deployed on Vercel+Render."],
    liveUrl: "ai-job-copilot-frontend.vercel.app",
    githubUrl: ""
  },
  {
    name: "Doctor Appointment App",
    techStack: "React Native, Expo, Node.js",
    bullets: ["Developed cross-platform mobile app with appointment booking, doctor search, and user authentication."],
    liveUrl: "",
    githubUrl: ""
  },
  {
    name: "E-Commerce Platform",
    techStack: "React.js, Node.js, MongoDB",
    bullets: ["Full-stack shopping platform with cart, payments, and admin dashboard."],
    liveUrl: "",
    githubUrl: ""
  },
  {
    name: "DSA Problem Solver",
    techStack: "JavaScript, Data Structures",
    bullets: ["Solved 300+ LeetCode problems covering arrays, trees, graphs, and dynamic programming."],
    liveUrl: "",
    githubUrl: ""
  }
];

const fallbackEducation = [
  {
    degree: "B.C.A - Bachelor of Computer Applications",
    institution: "Jhunjhunwala PG College, Ayodhya",
    duration: "2022-2025",
    cgpa: "7.68"
  },
  {
    degree: "Class XII - UP Board",
    institution: "UP LPCP School, Basti, UP",
    duration: "2022"
  }
];

const fallbackCertifications = [
  "Full Stack Development - DUCAT Institute (2024)",
  "Java DSA & Full Stack - DUCAT Institute (2024)"
];

function cleanText(value: unknown): string {
  const text = stringify(value)
    .replace(/\b(undefined|null)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return text === "-" || text === "|" ? "" : text;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function linkFromList(links: unknown, pattern: RegExp) {
  return toArray(links).map(cleanText).find((link) => pattern.test(link)) || "";
}

function normalizeTechStack(value: unknown) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(", ");
  return cleanText(value);
}

function normalizeBullets(value: unknown): string[] {
  return toArray(value).map(cleanText).filter(Boolean);
}

function normalizeProject(item: unknown) {
  if (typeof item === "string") {
    const [namePart, techPart, ...rest] = item.split("|").map((part) => part.trim());
    return {
      name: cleanText(namePart || "Project"),
      techStack: cleanText(techPart),
      bullets: normalizeBullets(rest.join(" ") || item),
      liveUrl: "",
      githubUrl: ""
    };
  }
  const project = (item || {}) as Record<string, unknown>;
  const bullets = normalizeBullets(project.bullets || project.bulletPoints || project.keyFeatures || project.features);
  const description = firstText(project.description, project.summary, project.impact, project.details);
  return {
    name: firstText(project.name, project.projectName, project.title, "Project"),
    techStack: normalizeTechStack(project.techStack || project.technologies || project.tech || project.stack),
    bullets: bullets.length ? bullets : normalizeBullets(description),
    liveUrl: firstText(project.liveUrl, project.demoUrl, project.liveDemoLink, project.url),
    githubUrl: firstText(project.githubUrl, project.github, project.repoUrl, project.repositoryUrl, project.sourceUrl)
  };
}

function normalizeProjects(value: unknown) {
  const projects = toArray(value).map(normalizeProject).filter((project) => project.name || project.bullets.length);
  return projects.length ? projects : fallbackProjects;
}

function normalizeEducationItem(item: unknown) {
  if (typeof item === "string") {
    return { degree: cleanText(item), institution: "", duration: "", cgpa: "" };
  }
  const education = (item || {}) as Record<string, unknown>;
  return {
    degree: firstText(education.degree, education.course, education.qualification),
    institution: firstText(education.institution, education.college, education.school, education.university),
    duration: firstText(education.duration, education.years, education.graduationYear, education.year),
    cgpa: firstText(education.cgpa, education.gpa, education.marks)
  };
}

function normalizeEducation(value: unknown) {
  const education = toArray(value).map(normalizeEducationItem).filter((item) => item.degree || item.institution);
  return education.length ? education : fallbackEducation;
}

function normalizeExperienceItem(item: unknown) {
  if (typeof item === "string") {
    return { title: "", company: "", duration: "", location: "", bullets: normalizeBullets(item) };
  }
  const experience = (item || {}) as Record<string, unknown>;
  const bullets = normalizeBullets(experience.bullets || experience.bulletPoints || experience.achievements);
  const description = firstText(experience.description, experience.summary, experience.details);
  return {
    title: firstText(experience.role, experience.title, experience.position),
    company: firstText(experience.company, experience.employer, experience.organization),
    duration: firstText(experience.duration, experience.dates, experience.startDate && experience.endDate ? `${experience.startDate} - ${experience.endDate}` : experience.startDate),
    location: firstText(experience.location),
    bullets: bullets.length ? bullets : normalizeBullets(description)
  };
}

function normalizeExperience(value: unknown) {
  return toArray(value).map(normalizeExperienceItem).filter((item) => item.title || item.company || item.bullets.length);
}

function normalizeCertifications(value: unknown) {
  const certifications = toArray(value).map(cleanText).filter(Boolean);
  return certifications.length ? certifications : fallbackCertifications;
}

function normalizeResumeContent(source: any = {}) {
  const parsedData = source?.parsedData || {};
  const content = source?.content || {};
  const directContent = source?.parsedData || source?.content ? {} : source;
  return {
    ...directContent,
    ...parsedData,
    ...content,
    rawText: source?.rawText || content?.rawText || parsedData?.rawText || directContent?.rawText || ""
  };
}

export async function buildBeautifulResumePdfBuffer(userId: string, content: any): Promise<Buffer> {
  const user = await findRecordById("users", userId);
  const profile = await findOneRecord("profiles", { userId });
  const resume = normalizeResumeContent(content);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      const pageLeft = 40;
      const pageWidth = 532;
      const navy = "#1a1a2e";
      const body = "#222222";
      const muted = "#555555";

      const name = firstText(resume.name, user?.fullName, "Yogesh Dubey");
      const role = firstText(resume.headline, resume.role, "Full Stack Developer | MERN Stack");
      const email = firstText(resume.email, user?.email, "yogeshdubey8924@gmail.com");
      const phone = firstText(resume.phone, user?.phone, "+91-6392778770");
      const github = firstText(resume.githubUrl, resume.github, profile?.githubUrl, linkFromList(resume.links, /github/i), "github.com/Yogesh-Dubey18").replace(/^https?:\/\/(www\.)?/, "");
      const linkedin = "LinkedIn";
      const location = firstText(resume.location, profile?.location, "Ayodhya, UP");
      const summaryText = firstText(resume.summary, fallbackSummary);
      const projectsList = normalizeProjects(resume.projects);
      const experienceList = normalizeExperience(resume.experience);
      const educationList = normalizeEducation(resume.education);
      const certificationsList = normalizeCertifications(resume.certifications);

      const renderHeader = () => {
        doc.font("Helvetica-Bold").fontSize(20).fillColor(navy).text(name, { align: "center" });
        doc.font("Helvetica-Bold").fontSize(12).fillColor(muted).text(role, { align: "center" });
        doc.font("Helvetica").fontSize(8.7).fillColor(body).text([email, phone, github, linkedin, location].filter(Boolean).join(" | "), { align: "center" });
        const y = doc.y + 4;
        doc.strokeColor(navy).lineWidth(0.6).moveTo(pageLeft, y).lineTo(pageLeft + pageWidth, y).stroke();
        doc.y = y + 7;
      };

      const renderSectionHeader = (title: string) => {
        doc.moveDown(0.28);
        const y = doc.y;
        doc.font("Helvetica-Bold").fontSize(10.6).fillColor(navy).text(title.toUpperCase(), pageLeft, y);
        doc.strokeColor(navy).lineWidth(0.45).moveTo(pageLeft, y + 12).lineTo(pageLeft + pageWidth, y + 12).stroke();
        doc.y = y + 15;
      };

      const renderBodyText = (text: string, fontSize = 8.65) => {
        const value = cleanText(text);
        if (!value) return;
        doc.font("Helvetica").fontSize(fontSize).fillColor(body).text(value, pageLeft, doc.y, {
          width: pageWidth,
          lineGap: 0.2
        });
      };

      const renderBullet = (text: string) => {
        const value = cleanText(text);
        if (!value) return;
        const y = doc.y;
        doc.font("Helvetica").fontSize(8.45).fillColor(body).text("-", pageLeft + 8, y, { width: 8 });
        doc.text(value, pageLeft + 20, y, { width: pageWidth - 20, lineGap: 0.1 });
        doc.moveDown(0.08);
      };

      renderHeader();

      renderSectionHeader("Professional Summary");
      renderBodyText(summaryText, 8.7);

      renderSectionHeader("Technical Skills");
      for (const [category, skills] of fixedSkillCategories) {
        const y = doc.y;
        doc.font("Helvetica-Bold").fontSize(8.7).fillColor(navy).text(`${category}: `, pageLeft, y, { continued: true });
        doc.font("Helvetica").fillColor(body).text(skills, { width: pageWidth, lineGap: 0.1 });
        doc.moveDown(0.06);
      }

      renderSectionHeader("Projects");
      for (const project of projectsList) {
        const title = [project.name, project.techStack].filter(Boolean).join(" | ");
        doc.font("Helvetica-Bold").fontSize(9).fillColor(navy).text(title, pageLeft, doc.y, { width: pageWidth, lineGap: 0 });
        for (const bullet of project.bullets.slice(0, 2)) renderBullet(bullet);
        const links = [
          project.liveUrl ? `Live: ${project.liveUrl}` : "",
          project.githubUrl ? `GitHub: ${project.githubUrl}` : ""
        ].filter(Boolean).join(" | ");
        if (links) {
          doc.font("Helvetica").fontSize(8.2).fillColor(muted).text(links, pageLeft + 20, doc.y, { width: pageWidth - 20, lineGap: 0 });
          doc.moveDown(0.12);
        }
      }

      if (experienceList.length) {
        renderSectionHeader("Experience");
        for (const exp of experienceList) {
          const title = [exp.title, exp.company].filter(Boolean).join(" | ");
          if (title) doc.font("Helvetica-Bold").fontSize(8.9).fillColor(navy).text(title, pageLeft, doc.y, { width: pageWidth, lineGap: 0 });
          const meta = [exp.duration, exp.location].filter(Boolean).join(" | ");
          if (meta) doc.font("Helvetica-Oblique").fontSize(8.2).fillColor(muted).text(meta, pageLeft, doc.y, { width: pageWidth, lineGap: 0 });
          for (const bullet of exp.bullets.slice(0, 2)) renderBullet(bullet);
        }
      }

      renderSectionHeader("Education");
      for (const edu of educationList) {
        const title = cleanText(edu.degree);
        const meta = [edu.institution, edu.duration, edu.cgpa ? `CGPA: ${edu.cgpa}` : ""].filter(Boolean).join(" | ");
        doc.font("Helvetica-Bold").fontSize(8.75).fillColor(navy).text(title, pageLeft, doc.y, { width: pageWidth, lineGap: 0 });
        if (meta) doc.font("Helvetica").fontSize(8.35).fillColor(body).text(meta, pageLeft, doc.y, { width: pageWidth, lineGap: 0 });
        doc.moveDown(0.08);
      }

      renderSectionHeader("Certifications");
      for (const certification of certificationsList) renderBullet(certification);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function buildLegacyBeautifulResumePdfBuffer(userId: string, content: any): Promise<Buffer> {
  const user = await findRecordById("users", userId);
  const profile = await findOneRecord("profiles", { userId });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      const name = user?.fullName || "Yogesh Dubey";
      const role = profile?.currentRole || (profile?.targetRoles && profile.targetRoles[0]) || "Full-Stack Developer";
      const email = user?.email || "";
      const phone = user?.phone || "";
      const github = profile?.githubUrl || "";
      const linkedin = profile?.linkedinUrl || "";

      doc.font("Helvetica-Bold")
         .fontSize(20)
         .fillColor("#1a1a2e")
         .text(name, { align: "center" });

      if (role) {
        doc.font("Helvetica-Bold")
           .fontSize(11)
           .fillColor("#555555")
           .text(role, { align: "center" })
           .moveDown(0.2);
      }

      const contactParts = [
        email,
        phone,
        github ? github.replace(/^https?:\/\/(www\.)?/, "") : "",
        linkedin ? linkedin.replace(/^https?:\/\/(www\.)?/, "") : ""
      ].filter(Boolean);

      doc.font("Helvetica")
         .fontSize(9.5)
         .fillColor("#222222")
         .text(contactParts.join("  |  "), { align: "center" });

      doc.moveDown(0.6);

      const renderSectionHeader = (title: string) => {
        doc.moveDown(0.8);
        const y = doc.y;
        
        doc.font("Helvetica-Bold")
           .fontSize(12)
           .fillColor("#1a1a2e")
           .text(title, 40, y);

        doc.strokeColor("#1a1a2e")
           .lineWidth(0.75)
           .moveTo(40, y + 14)
           .lineTo(572, y + 14)
           .stroke();

        doc.moveDown(0.6);
      };

      const renderBullets = (bullets: any) => {
        const bulletList = toArray(bullets);
        for (const bullet of bulletList) {
          const bulletStr = String(bullet).trim();
          if (!bulletStr) continue;
          
          const currentY = doc.y;
          doc.font("Helvetica")
             .fontSize(9.5)
             .fillColor("#222222")
             .text("•", 52, currentY);
          
          doc.text(bulletStr, 62, currentY, {
            width: 510,
            align: "justify",
            lineGap: 1.5
          });
          doc.moveDown(0.25);
        }
      };

      const summaryText = content?.summary || "";
      if (summaryText) {
        renderSectionHeader("Professional Summary");
        doc.font("Helvetica")
           .fontSize(9.5)
           .fillColor("#222222")
           .text(summaryText, 40, doc.y, {
             width: 532,
             align: "justify",
             lineGap: 2
           });
      }

      const skillsList = toArray(content?.skills);
      if (skillsList.length > 0) {
        renderSectionHeader("Technical Skills");
        const categories = categorizeSkills(skillsList as string[]);
        for (const [category, skills] of Object.entries(categories)) {
          if (skills.length === 0) continue;
          
          const currentY = doc.y;
          doc.font("Helvetica-Bold")
             .fontSize(9.5)
             .fillColor("#1a1a2e")
             .text(`${category}: `, 40, currentY, { continued: true });
             
          doc.font("Helvetica")
             .fillColor("#222222")
             .text(skills.join(", "), {
               width: 532,
               lineGap: 1.5
             });
          doc.moveDown(0.2);
        }
      }

      const projectsList = toArray(content?.projects);
      if (projectsList.length > 0) {
        renderSectionHeader("Projects");
        for (let i = 0; i < projectsList.length; i++) {
          const p = projectsList[i] as any;
          if (!p) continue;
          
          if (i > 0) doc.moveDown(0.4);

          const name = p.name || p.projectName || p.title || "Project";
          const tech = p.technologies || p.techStack || p.tech || "";
          const bullets = p.bullets || p.bulletPoints || p.description || p.details || [];
          
          const currentY = doc.y;
          doc.font("Helvetica-Bold")
             .fontSize(10.5)
             .fillColor("#1a1a2e")
             .text(name, 40, currentY, { continued: true });

          if (tech) {
            doc.font("Helvetica-Oblique")
               .fontSize(9.5)
               .fillColor("#555555")
               .text(`  (${tech})`, { continued: false });
          } else {
            doc.text("", { continued: false });
          }
          
          doc.moveDown(0.2);
          renderBullets(bullets);
        }
      }

      const experienceList = toArray(content?.experience);
      if (experienceList.length > 0) {
        renderSectionHeader("Experience");
        for (let i = 0; i < experienceList.length; i++) {
          const exp = experienceList[i] as any;
          if (!exp) continue;
          
          if (i > 0) doc.moveDown(0.4);

          const company = exp.company || exp.employer || exp.organization || "";
          const role = exp.role || exp.title || exp.position || "";
          const duration = exp.duration || exp.dates || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.startDate || "");
          const location = exp.location || "";
          const bullets = exp.bullets || exp.bulletPoints || exp.description || exp.details || [];

          const currentY = doc.y;
          doc.font("Helvetica-Bold")
             .fontSize(10.5)
             .fillColor("#1a1a2e")
             .text(`${role} at ${company}`, 40, currentY);
             
          if (duration || location) {
            const locDur = [duration, location].filter(Boolean).join(" | ");
            doc.font("Helvetica-Oblique")
               .fontSize(9.5)
               .fillColor("#555555")
               .text(locDur, 40, currentY, {
                 align: "right",
                 width: 532
               });
          }
          
          doc.moveDown(0.2);
          renderBullets(bullets);
        }
      }

      const educationList = toArray(content?.education);
      if (educationList.length > 0) {
        renderSectionHeader("Education");
        for (let i = 0; i < educationList.length; i++) {
          const edu = educationList[i] as any;
          if (!edu) continue;
          
          if (i > 0) doc.moveDown(0.4);

          const institution = edu.institution || edu.college || edu.school || edu.university || "";
          const degree = edu.degree || "";
          const field = edu.field || edu.major || edu.specialization || "";
          const duration = edu.duration || edu.graduationYear || edu.year || "";
          const cgpa = edu.cgpa || edu.gpa || edu.marks || "";

          const currentY = doc.y;
          doc.font("Helvetica-Bold")
             .fontSize(10.5)
             .fillColor("#1a1a2e")
             .text(`${degree}${field ? ` in ${field}` : ""}`, 40, currentY, { continued: true });
             
          doc.font("Helvetica-Oblique")
             .fillColor("#555555")
             .text(` - ${institution}`, { continued: false });

          if (duration || cgpa) {
            const rightText = [duration, cgpa ? `CGPA: ${cgpa}` : ""].filter(Boolean).join("  |  ");
            doc.font("Helvetica")
               .fontSize(9.5)
               .fillColor("#555555")
               .text(rightText, 40, currentY, {
                 align: "right",
                 width: 532
               });
          }
          doc.moveDown(0.25);
        }
      }

      const certificationsList = toArray(content?.certifications);
      if (certificationsList.length > 0) {
        renderSectionHeader("Certifications");
        renderBullets(certificationsList);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function buildGenericPdfBuffer(title: string, sections: PdfSection[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.font("Helvetica-Bold")
         .fontSize(18)
         .fillColor("#1a1a2e")
         .text(title, { align: "center" });

      doc.font("Helvetica-Oblique")
         .fontSize(9)
         .fillColor("#666666")
         .text(`Generated at ${new Date().toISOString()}`, { align: "center" })
         .moveDown(1.5);

      for (const section of sections) {
        const heading = section.heading.trim();
        if (!heading) continue;

        doc.font("Helvetica-Bold")
           .fontSize(12)
           .fillColor("#1a1a2e")
           .text(heading.toUpperCase());

        const y = doc.y;
        doc.strokeColor("#cccccc")
           .lineWidth(0.5)
           .moveTo(50, y + 2)
           .lineTo(562, y + 2)
           .stroke();

        doc.moveDown(0.6);

        const sectionLines = section.lines.flatMap((line) => toArray(line)).map(normalizePdfText).filter(Boolean);
        if (sectionLines.length === 0) {
          doc.font("Helvetica-Oblique")
             .fontSize(10)
             .fillColor("#777777")
             .text("No saved content yet.");
          doc.moveDown(0.8);
          continue;
        }

        for (const line of sectionLines) {
          if (line.startsWith("- ") || line.startsWith("* ")) {
            const bulletText = line.slice(2).trim();
            const currentY = doc.y;
            doc.font("Helvetica")
               .fontSize(10)
               .fillColor("#222222")
               .text("•", 60, currentY);
            doc.text(bulletText, 70, currentY, { width: 492, align: "justify", lineGap: 2 });
          } else {
            doc.font("Helvetica")
               .fontSize(10)
               .fillColor("#222222")
               .text(line, { width: 512, align: "justify", lineGap: 2 });
          }
          doc.moveDown(0.4);
        }
        doc.moveDown(0.8);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
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

export async function resolvePdfExportUrl(exportDoc: any) {
  if (!exportDoc) return exportDoc;
  const doc = exportDoc.toObject ? exportDoc.toObject() : exportDoc;
  let key = doc.fileUrl;
  if (key.startsWith("/uploads/")) {
    key = key.replace("/uploads/", "");
  }
  doc.fileUrl = await getSignedUrl(key);
  return doc;
}

async function writePdfExport(userId: string, sourceType: PdfExportType, sourceId: string, title: string, sections: PdfSection[], metadata: Record<string, unknown> = {}, privacyNotes: string[] = []) {
  const buffer = await buildGenericPdfBuffer(title, sections);
  const shortHash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const fileName = `${Date.now()}-${safeSegment(sourceType)}-${safeSegment(sourceId).slice(-16)}-${shortHash}.pdf`;
  const fileKey = `exports/${fileName}`;

  await uploadFile(fileKey, buffer, "application/pdf");

  return createRecord("pdfExports", {
    userId,
    sourceType,
    sourceId,
    title,
    fileName,
    fileUrl: fileKey,
    mimeType: "application/pdf",
    byteSize: buffer.byteLength,
    status: "ready",
    renderer,
    storage: getProvider(),
    metadata: { ...metadata, checksumSha256: shortHash },
    privacy: {
      ownerVerified: true,
      redactedFields: [],
      notes: [`Generated file is stored via ${getProvider()} storage provider.`, ...privacyNotes]
    }
  }).then(resolvePdfExportUrl);
}

async function writeProfessionalResumePdfExport(userId: string, sourceId: string, title: string, content: any, metadata: Record<string, unknown> = {}) {
  const buffer = await buildBeautifulResumePdfBuffer(userId, content);
  const shortHash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const fileName = `Resume_YogeshDubey.pdf`;
  const fileKey = `exports/${userId}/${shortHash}/${fileName}`;

  await uploadFile(fileKey, buffer, "application/pdf");

  return createRecord("pdfExports", {
    userId,
    sourceType: "resume",
    sourceId,
    title,
    fileName,
    fileUrl: fileKey,
    mimeType: "application/pdf",
    byteSize: buffer.byteLength,
    status: "ready",
    renderer,
    storage: getProvider(),
    metadata: { ...metadata, checksumSha256: shortHash, template: "one-page-professional-resume" },
    privacy: {
      ownerVerified: true,
      redactedFields: [],
      notes: ["Generated via PDFKit one-page professional resume template."]
    }
  }).then(resolvePdfExportUrl);
}

export async function listPdfExports(userId: string) {
  const list = await findRecords("pdfExports", { userId }, { sort: { createdAt: -1 }, limit: 50 });
  return Promise.all(list.map((item) => resolvePdfExportUrl(item)));
}

export async function getPdfExport(userId: string, id: string) {
  const exportDoc = assertOwned(await findRecordById("pdfExports", id), userId, "PDF export");
  return resolvePdfExportUrl(exportDoc);
}

export async function exportResumePdf(userId: string, id: string) {
  const version = await findRecordById("resumeVersions", id);
  if (version && normalizeId(version.userId) === normalizeId(userId)) {
    return writeProfessionalResumePdfExport(userId, id, version.title || "Resume version export", normalizeResumeContent(version), { resumeVersionId: id });
  }
  const resume = assertOwned(await findRecordById("resumes", id), userId, "Resume");
  return writeProfessionalResumePdfExport(userId, id, resume.fileName || "Base resume export", normalizeResumeContent(resume), { resumeId: id });
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

export async function exportResumePdfDirect(userId: string, id: string | null) {
  let content: any = null;
  let targetId = id;

  if (!targetId) {
    const latestResume = await findRecords("resumes", { userId }, { sort: { createdAt: -1 }, limit: 1 });
    if (latestResume && latestResume.length > 0) {
      targetId = normalizeId(latestResume[0]);
    }
  }

  if (!targetId) {
    throw new ApiError(404, "No resumes found to export");
  }

  const tailored = await findRecordById("tailoredResumes", targetId);
  if (tailored && normalizeId(tailored.userId) === normalizeId(userId)) {
    const version = tailored.resumeVersionId ? await findRecordById("resumeVersions", normalizeId(tailored.resumeVersionId)) : null;
    content = normalizeResumeContent({
      summary: tailored.updatedSummary || version?.content?.summary,
      skills: tailored.updatedSkills || version?.content?.skills,
      projects: tailored.improvedProjects || version?.content?.projects,
      experience: version?.content?.experience,
      education: version?.content?.education,
      certifications: version?.content?.certifications
    });
  } else {
    const version = await findRecordById("resumeVersions", targetId);
    if (version && normalizeId(version.userId) === normalizeId(userId)) {
      content = normalizeResumeContent(version);
    } else {
      const resume = assertOwned(await findRecordById("resumes", targetId), userId, "Resume");
      content = normalizeResumeContent(resume);
    }
  }

  const buffer = await buildBeautifulResumePdfBuffer(userId, content);

  const user = await findRecordById("users", userId);
  const profile = await findOneRecord("profiles", { userId });
  const role = profile?.currentRole || (profile?.targetRoles && profile.targetRoles[0]) || "FullStackDeveloper";
  const cleanName = (user?.fullName || "Yogesh Dubey").replace(/\s+/g, "");
  const cleanRole = role.replace(/\s+/g, "");
  
  const fileName = `Resume_YogeshDubey.pdf`;
  const shortHash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const fileKey = `exports/${userId}/${shortHash}/${fileName}`;

  await uploadFile(fileKey, buffer, "application/pdf");

  await createRecord("pdfExports", {
    userId,
    sourceType: "resume",
    sourceId: targetId,
    title: "Resume Export",
    fileName,
    fileUrl: fileKey,
    mimeType: "application/pdf",
    byteSize: buffer.byteLength,
    status: "ready",
    renderer,
    storage: getProvider(),
    metadata: { resumeId: targetId, checksumSha256: shortHash },
    privacy: {
      ownerVerified: true,
      redactedFields: [],
      notes: ["Generated via PDFKit professional resume template."]
    }
  });

  return { buffer, fileName };
}
