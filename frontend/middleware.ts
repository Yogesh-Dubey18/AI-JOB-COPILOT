import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/resume",
  "/jobs",
  "/daily-job-feed",
  "/apply-assistant",
  "/application-kit",
  "/applications",
  "/interviews",
  "/skill-roadmap",
  "/portfolio-generator",
  "/job-scam-detector",
  "/career-mentor-chat",
  "/analytics",
  "/settings",
  "/admin",
  "/company-research",
  "/answer-vault",
  "/career-vault",
  "/guided-workflow",
  "/pdf-export",
  "/contacts",
  "/linkedin-optimizer",
  "/github-analyzer",
  "/notifications"
];

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (pathname === "/skill-gap" || pathname === "/learning-roadmap") {
    const url = req.nextUrl.clone();
    url.pathname = "/skill-roadmap";
    return NextResponse.redirect(url);
  }

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const hasBackendCookie = req.cookies.has("accessToken");
  const hasFrontendSessionMarker = req.cookies.has("ajc_session");
  if (isProtected && !hasBackendCookie && !hasFrontendSessionMarker) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)"]
};
