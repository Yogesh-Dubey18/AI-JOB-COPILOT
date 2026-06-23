export type PlanId = "free" | "pro" | "premium" | "admin";

export type PlanConfig = {
  id: PlanId;
  name: string;
  monthlyPriceInr: number;
  aiCreditsPerMonth: number;
  dailyJobMatches: number | "unlimited";
  resumeTailoring: number | "unlimited";
  stripePriceEnv?: string;
  upgradePrompt: string;
  features: string[];
};

export const PLAN_CATALOG: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceInr: 0,
    aiCreditsPerMonth: 999,
    dailyJobMatches: 5,
    resumeTailoring: 2,
    upgradePrompt: "Upgrade when you need more resume tailoring, application kits, and interview prep.",
    features: ["Resume upload", "Basic ATS score", "5 job matches/day", "Application tracker"]
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceInr: 499,
    aiCreditsPerMonth: 500,
    dailyJobMatches: "unlimited",
    resumeTailoring: "unlimited",
    stripePriceEnv: "STRIPE_PRICE_PRO",
    upgradePrompt: "Best for active job-search sprints with daily tailoring and outreach.",
    features: ["Unlimited resume tailoring", "Cover letters", "Interview prep", "Daily job digest"]
  },
  premium: {
    id: "premium",
    name: "Premium",
    monthlyPriceInr: 999,
    aiCreditsPerMonth: 1_500,
    dailyJobMatches: "unlimited",
    resumeTailoring: "unlimited",
    stripePriceEnv: "STRIPE_PRICE_PREMIUM",
    upgradePrompt: "Best for interview-heavy sprints with mock practice and portfolio support.",
    features: ["Mock interview", "Portfolio generator", "LinkedIn optimizer", "Advanced AI mentor"]
  },
  admin: {
    id: "admin",
    name: "Admin",
    monthlyPriceInr: 0,
    aiCreditsPerMonth: 10_000,
    dailyJobMatches: "unlimited",
    resumeTailoring: "unlimited",
    upgradePrompt: "Internal operations tier for admin review and usage monitoring.",
    features: ["User management", "Job management", "AI usage monitoring", "Feedback review"]
  }
};

export const DEFAULT_PLAN_ID: PlanId = "free";
