import { JobDraft } from "./types";

const skillBank = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Express",
  "MongoDB",
  "SQL",
  "Java",
  "Spring Boot",
  "Tailwind",
  "REST API",
  "GraphQL",
  "Docker",
  "AWS",
  "Git",
  "DSA"
];

function clean(value: unknown, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function firstMatch(text: string, patterns: RegExp[], fallback = "") {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return fallback;
}

function hostCompany(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const [name] = host.split(".");
    return clean(name.replace(/[-_]+/g, " "), "Company");
  } catch {
    return "Company";
  }
}

function detectTitle(text: string, pageTitle: string) {
  const lines = text.split(/\n+/).map((line) => clean(line)).filter(Boolean);
  const roleLine = lines.find((line) => /developer|engineer|intern|full stack|frontend|backend|software/i.test(line) && line.length < 90);
  return clean(roleLine || pageTitle.split(/[|-]/)[0], "Software Developer");
}

function detectLocation(text: string) {
  return firstMatch(text, [
    /location[:\s]+([A-Za-z,\s-]{3,80})/i,
    /(remote|hybrid|onsite|bengaluru|bangalore|pune|mumbai|delhi|noida|gurugram|hyderabad|chennai)/i
  ], "Remote");
}

function detectCompany(text: string, pageTitle: string, url: string) {
  return firstMatch(text, [
    /company[:\s]+([A-Za-z0-9 .&-]{2,80})/i,
    /at\s+([A-Z][A-Za-z0-9 .&-]{2,60}?)(?:\s+Location|\s+Requirements|\s+Responsibilities|$)/i
  ], clean(pageTitle.split("|")[1] || hostCompany(url), "Company"));
}

export function parseJobFromText(text: string, pageTitle = "", url = ""): JobDraft {
  const visibleText = clean(text).slice(0, 6000);
  const skillsRequired = skillBank.filter((skill) => new RegExp(`\\b${skill.replace(".", "\\.")}\\b`, "i").test(visibleText));
  const riskFlags = [
    /registration fee|processing fee|security deposit|pay.*training/i.test(visibleText) ? "Payment or registration fee language detected." : "",
    /gmail\.com|yahoo\.com|hotmail\.com/i.test(visibleText) ? "Recruiter email may use a personal email domain." : "",
    !url ? "Source URL missing." : ""
  ].filter(Boolean);
  const location = detectLocation(visibleText);
  return {
    title: detectTitle(visibleText, pageTitle),
    company: detectCompany(visibleText, pageTitle, url),
    location,
    applyUrl: url,
    source: "Browser extension manual capture",
    description: visibleText.slice(0, 1800),
    skillsRequired,
    responsibilities: firstMatch(visibleText, [/responsibilities[:\s]+(.{20,500})/i]) ? [firstMatch(visibleText, [/responsibilities[:\s]+(.{20,500})/i])] : [],
    requirements: firstMatch(visibleText, [/requirements[:\s]+(.{20,500})/i]) ? [firstMatch(visibleText, [/requirements[:\s]+(.{20,500})/i])] : [],
    remoteType: /remote/i.test(location) || /remote/i.test(visibleText) ? "Remote" : /hybrid/i.test(visibleText) ? "Hybrid" : "Onsite",
    jobType: /intern/i.test(visibleText) ? "Internship" : "Full-time",
    riskFlags
  };
}

export function draftFromForm(form: HTMLFormElement): JobDraft {
  const data = new FormData(form);
  const skills = clean(data.get("skillsRequired")).split(",").map((skill) => clean(skill)).filter(Boolean);
  return {
    title: clean(data.get("title"), "Software Developer"),
    company: clean(data.get("company"), "Company"),
    location: clean(data.get("location"), "Remote"),
    applyUrl: clean(data.get("applyUrl")),
    source: "Browser extension manual capture",
    description: clean(data.get("description")),
    skillsRequired: skills,
    responsibilities: [],
    requirements: [],
    remoteType: /remote/i.test(clean(data.get("location"))) ? "Remote" : "Onsite",
    jobType: /intern/i.test(clean(data.get("title"))) ? "Internship" : "Full-time",
    riskFlags: []
  };
}
