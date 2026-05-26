import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-job-copilot-frontend.vercel.app";

/**
 * Phase 7: Portfolio SEO — generateMetadata for public portfolio pages.
 * Fetches minimal profile data server-side to populate og:title, og:description,
 * og:image, and canonical URL without leaking private data.
 *
 * Falls back to safe defaults if the portfolio is private or unavailable.
 */
export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://ai-job-copilot-backend-l6ut.onrender.com/api";

  try {
    const response = await fetch(`${apiBase}/portfolios/public/${slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      return defaultMetadata(slug);
    }

    const json = await response.json();
    const data = json?.data || json;
    const displayName = String(data?.displayName || data?.hero || "Career Portfolio");
    const headline = String(data?.headline || data?.bio || "Professional career portfolio built with AI Job Copilot.");
    const canonicalUrl = `${SITE_URL}/u/${slug}`;

    return {
      title: `${displayName} | AI Job Copilot`,
      description: headline.slice(0, 160),
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: "profile",
        title: `${displayName} | AI Job Copilot`,
        description: headline.slice(0, 160),
        url: canonicalUrl,
        siteName: "AI Job Copilot"
      },
      twitter: {
        card: "summary",
        title: `${displayName} | AI Job Copilot`,
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
    description: "A professional career portfolio powered by AI Job Copilot.",
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "profile",
      title: "Career Portfolio | AI Job Copilot",
      description: "A professional career portfolio powered by AI Job Copilot.",
      url: canonicalUrl,
      siteName: "AI Job Copilot"
    }
  };
}
