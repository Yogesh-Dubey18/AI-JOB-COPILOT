import fs from "node:fs/promises";

const knownSkills = ["React", "Node.js", "Express", "MongoDB", "JavaScript", "TypeScript", "Java", "DSA", "HTML", "CSS", "Tailwind", "SQL", "Git", "REST API", "JWT"];

export async function extractResumeText(filePath: string, fileType: string) {
  const buffer = await fs.readFile(filePath);
  if (fileType === "text/plain") return buffer.toString("utf8");
  const rough = buffer.toString("latin1").replace(/[^\x20-\x7E\n]/g, " ");
  const words = rough.split(/\s+/).filter((word) => word.length > 2 && word.length < 40);
  return words.slice(0, 900).join(" ") || "Text extraction fallback: upload a TXT resume for highest local parsing accuracy.";
}

export function parseResumeText(text: string) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = text.match(/(?:\+?\d[\s-]?){10,14}/)?.[0] || "";
  const links = Array.from(text.matchAll(/https?:\/\/[^\s)]+/g)).map((m) => m[0]);
  const skills = knownSkills.filter((skill) => new RegExp("\\b" + skill.replace(".", "\\.") + "\\b", "i").test(text));
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
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
    links
  };
}
