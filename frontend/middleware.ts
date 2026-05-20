import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/onboarding", "/profile", "/resume", "/jobs", "/daily-job-feed", "/apply-assistant", "/applications", "/interviews", "/skill-gap", "/learning-roadmap", "/portfolio-generator", "/job-scam-detector", "/career-mentor-chat", "/analytics", "/settings", "/admin"];

export function middleware(req: NextRequest) {
  const isProtected = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route));
  const hasToken = req.cookies.has("accessToken");
  if (isProtected && !hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)"]
};
