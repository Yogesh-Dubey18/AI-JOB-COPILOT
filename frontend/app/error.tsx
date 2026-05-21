"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureFrontendException } from "@/lib/monitoring";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureFrontendException(error, { digest: error.digest, boundary: "app-root" });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <section role="alert" className="w-full max-w-lg rounded-md border bg-card p-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-muted text-danger">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">The app caught this error safely. Try again, and check the backend health/status endpoints if it keeps happening.</p>
        <Button type="button" className="mt-5" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      </section>
    </main>
  );
}
