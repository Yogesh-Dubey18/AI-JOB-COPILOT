import type { Metadata } from "next";
import { PublicPortfolioClient } from "./public-portfolio-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-job-copilot-frontend.vercel.app";

type PublicPortfolioPageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PublicPortfolioPageProps): Promise<Metadata> {
  const slug = params.slug;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://ai-job-copilot-backend-l6ut.onrender.com/api";

  try {
    const response = await fetch(`${apiBase}/portfolios/public/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return defaultMetadata(slug);
    }

    const json = await response.json();
    const data = json?.data || json;
    const title = String(data?.title || data?.displayName || data?.hero || "Career Portfolio");
    const headline = String(data?.headline || data?.bio || "Professional career portfolio built with AI Job Copilot.");
    const canonicalUrl = `${SITE_URL}/u/${slug}`;

    return {
      title: `${title} | AI Job Copilot`,
      description: headline.slice(0, 160),
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: "profile",
        title: `${title} | AI Job Copilot`,
        description: headline.slice(0, 160),
        url: canonicalUrl,
        siteName: "AI Job Copilot"
      },
      twitter: {
        card: "summary",
        title: `${title} | AI Job Copilot`,
        description: headline.slice(0, 160)
      }
    };
  } catch {
    return defaultMetadata(slug);
  }
}

function defaultMetadata(slug: string): Metadata {
  const canonicalUrl = `${SITE_URL}/u/${slug}`;
  return {
    title: "Career Portfolio | AI Job Copilot",
    description: "A recruiter-safe public portfolio. Private or unpublished portfolios are not exposed.",
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "profile",
      title: "Career Portfolio | AI Job Copilot",
      description: "A recruiter-safe public portfolio. Private or unpublished portfolios are not exposed.",
      url: canonicalUrl,
      siteName: "AI Job Copilot"
    },
    twitter: {
      card: "summary",
      title: "Career Portfolio | AI Job Copilot",
      description: "A recruiter-safe public portfolio. Private or unpublished portfolios are not exposed."
    }
  };
}

export default function PublicPortfolioPage({ params }: PublicPortfolioPageProps) {
  return <PublicPortfolioClient slug={params.slug} />;
}
