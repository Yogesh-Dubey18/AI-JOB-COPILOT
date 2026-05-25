"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Client-side criteria validation states
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isCriteriaMet = hasMinLen && hasUpper && hasLower && hasDigit && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is required.");
      return;
    }
    if (!isCriteriaMet) {
      setError("Please ensure all password criteria are met and passwords match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to reset password. The link may have expired.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
            <p className="font-semibold">🎉 Password reset successfully!</p>
            <p className="mt-2 text-xs text-muted-foreground">Your password has been updated. You can now log in to your account.</p>
            <Link href="/login">
              <Button className="w-full mt-4">Go to Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!searchParams.get("token") && (
              <label className="block space-y-1 text-sm font-medium">
                <span>Reset Token</span>
                <Input
                  placeholder="Paste the reset token from your email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  aria-label="Reset token"
                />
              </label>
            )}

            <label className="block space-y-1 text-sm font-medium">
              <span>New Password</span>
              <Input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="New password"
              />
            </label>

            <label className="block space-y-1 text-sm font-medium">
              <span>Confirm New Password</span>
              <Input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-label="Confirm new password"
              />
            </label>

            {/* Password Criteria checklist */}
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground border space-y-1">
              <span className="font-semibold text-foreground">Password requirements:</span>
              <ul className="list-disc pl-4 space-y-0.5 leading-relaxed">
                <li className={hasMinLen ? "text-emerald-600 font-semibold" : ""}>At least 8 characters</li>
                <li className={hasUpper ? "text-emerald-600 font-semibold" : ""}>At least one uppercase letter</li>
                <li className={hasLower ? "text-emerald-600 font-semibold" : ""}>At least one lowercase letter</li>
                <li className={hasDigit ? "text-emerald-600 font-semibold" : ""}>At least one number</li>
                <li className={passwordsMatch ? "text-emerald-600 font-semibold" : ""}>Passwords must match</li>
              </ul>
            </div>

            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <Button className="w-full" type="submit" disabled={loading || !isCriteriaMet}>
              {loading ? "Resetting password..." : "Reset password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div>
      <PublicNav />
      <main className="px-4 py-16">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-sm text-muted-foreground animate-pulse">Loading reset details...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
