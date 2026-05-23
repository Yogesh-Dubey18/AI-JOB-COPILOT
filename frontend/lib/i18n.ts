/**
 * AI Job Copilot — Localization / i18n Foundation
 *
 * Supported languages (v2 beta foundation):
 *   en        — English (default)
 *   hi        — Hindi
 *   hinglish  — Hinglish (Hindi-English mix, informal)
 *
 * Usage:
 *   import { t, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/i18n";
 *   const label = t("nav.dashboard", lang); // returns string
 *
 * Adding a new string:
 *   1. Add the key to the `Translations` interface below.
 *   2. Add values for en, hi, and hinglish.
 *   3. Use `t(key, lang)` in any component.
 *
 * Adding a new language:
 *   1. Add the language code to SupportedLanguage type.
 *   2. Add it to SUPPORTED_LANGUAGES.
 *   3. Add a full translation object to TRANSLATIONS.
 */

export type SupportedLanguage = "en" | "hi" | "hinglish";

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी" },
  { code: "hinglish", label: "Hinglish", nativeLabel: "Hinglish" }
];

export interface Translations {
  // Navigation
  "nav.dashboard": string;
  "nav.workflow": string;
  "nav.resume": string;
  "nav.jobs": string;
  "nav.applications": string;
  "nav.interviews": string;
  "nav.contacts": string;
  "nav.skills": string;
  "nav.mentor": string;
  "nav.settings": string;
  // Hero / Landing
  "hero.title": string;
  "hero.subtitle": string;
  "hero.cta.primary": string;
  "hero.cta.secondary": string;
  // Auth
  "auth.login": string;
  "auth.register": string;
  "auth.email": string;
  "auth.password": string;
  "auth.submit.login": string;
  "auth.submit.register": string;
  "auth.logout": string;
  // Dashboard
  "dashboard.title": string;
  "dashboard.welcome": string;
  "dashboard.applications": string;
  "dashboard.interviews": string;
  "dashboard.resumeScore": string;
  // Resume
  "resume.upload": string;
  "resume.analyze": string;
  "resume.score": string;
  "resume.atsScore": string;
  // Jobs
  "jobs.title": string;
  "jobs.search": string;
  "jobs.filter": string;
  "jobs.matchScore": string;
  "jobs.save": string;
  "jobs.apply": string;
  // Application kit
  "kit.title": string;
  "kit.coverLetter": string;
  "kit.hrEmail": string;
  "kit.disclaimer": string;
  // Tracker
  "tracker.title": string;
  "tracker.addApplication": string;
  "tracker.stage.saved": string;
  "tracker.stage.applied": string;
  "tracker.stage.hrRound": string;
  "tracker.stage.technical": string;
  "tracker.stage.offer": string;
  "tracker.stage.selected": string;
  "tracker.stage.rejected": string;
  // Provider / integration
  "provider.live": string;
  "provider.ready": string;
  "provider.notConfigured": string;
  // Disclaimers
  "disclaimer.aiReview": string;
  "disclaimer.noAutoApply": string;
  "disclaimer.privacy": string;
}

const en: Translations = {
  "nav.dashboard": "Dashboard",
  "nav.workflow": "Workflow",
  "nav.resume": "Resume",
  "nav.jobs": "Jobs",
  "nav.applications": "Applications",
  "nav.interviews": "Interviews",
  "nav.contacts": "Contacts",
  "nav.skills": "Skills",
  "nav.mentor": "Mentor",
  "nav.settings": "Settings",
  "hero.title": "Your AI-Powered Job Search Copilot",
  "hero.subtitle": "Analyze your resume, find matching jobs, generate cover letters, track applications, and prepare for interviews — all in one place.",
  "hero.cta.primary": "Start for free",
  "hero.cta.secondary": "See how it works",
  "auth.login": "Log in",
  "auth.register": "Create account",
  "auth.email": "Email address",
  "auth.password": "Password",
  "auth.submit.login": "Log in",
  "auth.submit.register": "Create account",
  "auth.logout": "Log out",
  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Welcome back",
  "dashboard.applications": "Applications",
  "dashboard.interviews": "Interviews",
  "dashboard.resumeScore": "Resume score",
  "resume.upload": "Upload resume",
  "resume.analyze": "Analyze resume",
  "resume.score": "Resume score",
  "resume.atsScore": "ATS score",
  "jobs.title": "Jobs",
  "jobs.search": "Search jobs",
  "jobs.filter": "Filter",
  "jobs.matchScore": "Match score",
  "jobs.save": "Save job",
  "jobs.apply": "Apply now",
  "kit.title": "Application kit",
  "kit.coverLetter": "Cover letter",
  "kit.hrEmail": "HR email",
  "kit.disclaimer": "Review and personalise every generated section before applying.",
  "tracker.title": "Application tracker",
  "tracker.addApplication": "Add application",
  "tracker.stage.saved": "Saved",
  "tracker.stage.applied": "Applied",
  "tracker.stage.hrRound": "HR Round",
  "tracker.stage.technical": "Technical",
  "tracker.stage.offer": "Offer",
  "tracker.stage.selected": "Selected",
  "tracker.stage.rejected": "Rejected",
  "provider.live": "Live",
  "provider.ready": "Provider-ready",
  "provider.notConfigured": "Not configured",
  "disclaimer.aiReview": "AI output should be reviewed before applying.",
  "disclaimer.noAutoApply": "AI Job Copilot never auto-applies. You review and confirm every action.",
  "disclaimer.privacy": "Your data is private. Recruiters cannot access your profile without your explicit consent."
};

const hi: Translations = {
  "nav.dashboard": "डैशबोर्ड",
  "nav.workflow": "वर्कफ़्लो",
  "nav.resume": "रेज़्युमे",
  "nav.jobs": "नौकरियाँ",
  "nav.applications": "आवेदन",
  "nav.interviews": "इंटरव्यू",
  "nav.contacts": "संपर्क",
  "nav.skills": "कौशल",
  "nav.mentor": "मेंटर",
  "nav.settings": "सेटिंग्स",
  "hero.title": "आपका AI-संचालित जॉब सर्च कॉपायलट",
  "hero.subtitle": "अपना रेज़्युमे विश्लेषण करें, मिलती-जुलती नौकरियाँ खोजें, कवर लेटर बनाएं, आवेदन ट्रैक करें, और इंटरव्यू की तैयारी करें — एक ही जगह।",
  "hero.cta.primary": "मुफ़्त में शुरू करें",
  "hero.cta.secondary": "देखें यह कैसे काम करता है",
  "auth.login": "लॉगिन करें",
  "auth.register": "खाता बनाएं",
  "auth.email": "ईमेल पता",
  "auth.password": "पासवर्ड",
  "auth.submit.login": "लॉगिन करें",
  "auth.submit.register": "खाता बनाएं",
  "auth.logout": "लॉगआउट",
  "dashboard.title": "डैशबोर्ड",
  "dashboard.welcome": "वापस स्वागत है",
  "dashboard.applications": "आवेदन",
  "dashboard.interviews": "इंटरव्यू",
  "dashboard.resumeScore": "रेज़्युमे स्कोर",
  "resume.upload": "रेज़्युमे अपलोड करें",
  "resume.analyze": "रेज़्युमे विश्लेषण करें",
  "resume.score": "रेज़्युमे स्कोर",
  "resume.atsScore": "ATS स्कोर",
  "jobs.title": "नौकरियाँ",
  "jobs.search": "नौकरियाँ खोजें",
  "jobs.filter": "फ़िल्टर",
  "jobs.matchScore": "मिलान स्कोर",
  "jobs.save": "नौकरी सेव करें",
  "jobs.apply": "अभी आवेदन करें",
  "kit.title": "एप्लिकेशन किट",
  "kit.coverLetter": "कवर लेटर",
  "kit.hrEmail": "HR ईमेल",
  "kit.disclaimer": "आवेदन करने से पहले हर जनरेट किए गए सेक्शन की समीक्षा और व्यक्तिगतकरण करें।",
  "tracker.title": "एप्लिकेशन ट्रैकर",
  "tracker.addApplication": "आवेदन जोड़ें",
  "tracker.stage.saved": "सेव किया",
  "tracker.stage.applied": "आवेदन किया",
  "tracker.stage.hrRound": "HR राउंड",
  "tracker.stage.technical": "तकनीकी",
  "tracker.stage.offer": "ऑफर",
  "tracker.stage.selected": "चुना गया",
  "tracker.stage.rejected": "अस्वीकार",
  "provider.live": "लाइव",
  "provider.ready": "प्रोवाइडर-तैयार",
  "provider.notConfigured": "कॉन्फ़िगर नहीं किया",
  "disclaimer.aiReview": "आवेदन करने से पहले AI आउटपुट की समीक्षा करें।",
  "disclaimer.noAutoApply": "AI Job Copilot कभी स्वतः आवेदन नहीं करता। आप हर कदम की समीक्षा और पुष्टि करते हैं।",
  "disclaimer.privacy": "आपका डेटा निजी है। भर्तीकर्ता आपकी स्पष्ट सहमति के बिना आपकी प्रोफ़ाइल तक नहीं पहुंच सकते।"
};

const hinglish: Translations = {
  "nav.dashboard": "Dashboard",
  "nav.workflow": "Workflow",
  "nav.resume": "Resume",
  "nav.jobs": "Jobs",
  "nav.applications": "Applications",
  "nav.interviews": "Interviews",
  "nav.contacts": "Contacts",
  "nav.skills": "Skills",
  "nav.mentor": "Mentor",
  "nav.settings": "Settings",
  "hero.title": "Aapka AI-Powered Job Search Copilot",
  "hero.subtitle": "Resume analyze karo, matching jobs dhundo, cover letter generate karo, applications track karo, aur interviews ki taiyari karo — ek hi jagah mein.",
  "hero.cta.primary": "Free mein shuru karo",
  "hero.cta.secondary": "Dekho yeh kaise kaam karta hai",
  "auth.login": "Login karo",
  "auth.register": "Account banao",
  "auth.email": "Email address",
  "auth.password": "Password",
  "auth.submit.login": "Login karo",
  "auth.submit.register": "Account banao",
  "auth.logout": "Logout",
  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Wapas aaye, swagat hai",
  "dashboard.applications": "Applications",
  "dashboard.interviews": "Interviews",
  "dashboard.resumeScore": "Resume score",
  "resume.upload": "Resume upload karo",
  "resume.analyze": "Resume analyze karo",
  "resume.score": "Resume score",
  "resume.atsScore": "ATS score",
  "jobs.title": "Jobs",
  "jobs.search": "Jobs search karo",
  "jobs.filter": "Filter",
  "jobs.matchScore": "Match score",
  "jobs.save": "Job save karo",
  "jobs.apply": "Abhi apply karo",
  "kit.title": "Application kit",
  "kit.coverLetter": "Cover letter",
  "kit.hrEmail": "HR email",
  "kit.disclaimer": "Apply karne se pehle har generated section review aur personalize karo.",
  "tracker.title": "Application tracker",
  "tracker.addApplication": "Application add karo",
  "tracker.stage.saved": "Saved",
  "tracker.stage.applied": "Applied",
  "tracker.stage.hrRound": "HR Round",
  "tracker.stage.technical": "Technical",
  "tracker.stage.offer": "Offer",
  "tracker.stage.selected": "Selected",
  "tracker.stage.rejected": "Rejected",
  "provider.live": "Live",
  "provider.ready": "Provider-ready",
  "provider.notConfigured": "Configure nahi hua",
  "disclaimer.aiReview": "Apply karne se pehle AI output zaroor review karo.",
  "disclaimer.noAutoApply": "AI Job Copilot kabhi auto-apply nahi karta. Aap har action review aur confirm karte ho.",
  "disclaimer.privacy": "Aapka data private hai. Recruiters aapki profile tab hi dekh sakte hain jab aap explicitly consent dete ho."
};

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = { en, hi, hinglish };

/** Get a translated string. Falls back to English if key missing in target language. */
export function t(key: keyof Translations, lang: SupportedLanguage = DEFAULT_LANGUAGE): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

/** Get stored language from localStorage (client only). Falls back to default. */
export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem("ajc_lang") as SupportedLanguage | null;
  return stored && stored in TRANSLATIONS ? stored : DEFAULT_LANGUAGE;
}

/** Store language preference to localStorage (client only). */
export function setStoredLanguage(lang: SupportedLanguage): void {
  if (typeof window !== "undefined") localStorage.setItem("ajc_lang", lang);
}
