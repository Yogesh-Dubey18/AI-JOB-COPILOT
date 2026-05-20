export type PlanId = "free" | "pro" | "premium" | "admin";

export type PlanConfig = {
  id: PlanId;
  name: string;
  monthlyPriceInr: number;
  aiCreditsPerMonth: number;
  dailyJobMatches: number | "unlimited";
  resumeTailoring: number | "unlimited";
  features: string[];
};

export const PLAN_CATALOG: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceInr: 0,
    aiCreditsPerMonth: 50,
    dailyJobMatches: 5,
    resumeTailoring: 2,
    features: ["Resume upload", "Basic ATS score", "5 job matches/day", "Application tracker"]
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceInr: 499,
    aiCreditsPerMonth: 500,
    dailyJobMatches: "unlimited",
    resumeTailoring: "unlimited",
    features: ["Unlimited resume tailoring", "Cover letters", "Interview prep", "Daily job digest"]
  },
  premium: {
    id: "premium",
    name: "Premium",
    monthlyPriceInr: 999,
    aiCreditsPerMonth: 1_500,
    dailyJobMatches: "unlimited",
    resumeTailoring: "unlimited",
    features: ["Mock interview", "Portfolio generator", "LinkedIn optimizer", "Advanced AI mentor"]
  },
  admin: {
    id: "admin",
    name: "Admin",
    monthlyPriceInr: 0,
    aiCreditsPerMonth: 10_000,
    dailyJobMatches: "unlimited",
    resumeTailoring: "unlimited",
    features: ["User management", "Job management", "AI usage monitoring", "Feedback review"]
  }
};

export const DEFAULT_PLAN_ID: PlanId = "free";
