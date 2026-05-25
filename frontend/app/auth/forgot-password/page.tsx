"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"live" | "ready" | "not_configured" | null>(null);

  useEffect(() => {
    api.get<any>("/auth/providers/status")
      .then((res) => {
        if (res && res.email) {
          setEmailStatus(res.email.status);
        }
      })
      .catch(() => {
        // Fallback silently
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post<any>("/auth/forgot-password", { email });
      setMessage(res.message || "If an account exists, a recovery link will be sent to your email.");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Could not submit request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PublicNav />
      <main className="px-4 py-16">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailStatus && emailStatus !== "live" && !message && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                <p className="font-semibold">⚠️ Notice: Email service not active</p>
                <p className="mt-1">
                  The password recovery system is running in provider-ready fallback mode.
                  Reset links will be printed to server logs or helper message views.
                </p>
              </div>
            )}

            {message ? (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                <p>{message}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  You can close this page now or go back to <Link href="/login" className="font-semibold text-primary hover:underline">Login</Link>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your email address below and we'll send you a secure link to reset your password.
                </p>
                <label className="block space-y-1 text-sm font-medium">
                  <span>Email address</span>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-label="Email address"
                  />
                </label>
                {error && (
                  <p className="text-sm text-danger" role="alert">
                    {error}
                  </p>
                )}
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Sending link..." : "Send reset link"}
                </Button>
              </form>
            )}
            {!message && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Remember your password?{" "}
                <Link className="font-semibold text-primary hover:underline" href="/login">
                  Login
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
