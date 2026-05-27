"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SkillGapRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/skill-roadmap");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground animate-pulse">Redirecting to skill roadmap...</p>
    </div>
  );
}
