"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Verification token is missing. Please check your email link.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        await api.post("/auth/verify-email", { token });
        setSuccess(true);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Failed to verify email. The link may have expired or is invalid.");
        }
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Email Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center space-y-3 py-6">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Verifying your email address...</p>
          </div>
        )}

        {!loading && success && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-200">Email Verified!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your email address has been successfully verified. You can now access all features of your AI Job Copilot account.
            </p>
            <Link href="/login">
              <Button className="w-full mt-4">Go to Login</Button>
            </Link>
          </div>
        )}

        {!loading && error && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-red-950 dark:text-red-200">Verification Failed</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error}
            </p>
            <div className="flex gap-2 mt-4">
              <Link href="/register" className="flex-1">
                <Button variant="outline" className="w-full">Sign Up</Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div>
      <PublicNav />
      <main className="px-4 py-16">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </main>
    </div>
  );
}
