"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import { persistAuthSession } from "@/lib/auth-session";
import { loginSchema, registerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type NoticeKind = "cold-start" | "session-missing" | "not-found" | "";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [noticeKind, setNoticeKind] = useState<NoticeKind>("");
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [googleLive, setGoogleLive] = useState(false);
  const lastValues = useRef<z.infer<typeof loginSchema> | z.infer<typeof registerSchema> | null>(null);
  const schema = mode === "login" ? loginSchema : registerSchema;
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  // Ping backend on mount so Render starts warming before the user submits
  useEffect(() => {
    api.get("/health").catch(() => {});
  }, []);

  // Fetch Google OAuth status
  useEffect(() => {
    api.get<any>("/auth/providers/status")
      .then((res) => {
        if (res?.google?.configured) {
          setGoogleLive(true);
        }
      })
      .catch(() => {});
  }, []);

  // Hydrate Google OAuth redirect session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const googleToken = params.get("googleToken");
      const err = params.get("error");
      if (googleToken) {
        const sessionReady = persistAuthSession({ accessToken: googleToken });
        if (sessionReady) {
          router.push("/dashboard");
        }
      } else if (err) {
        setError(err);
      }
    }
  }, [router]);

  async function onSubmit(values: z.infer<typeof schema>) {
    setError("");
    setNoticeKind("");
    lastValues.current = values;
    try {
      const result = await api.post(mode === "login" ? "/auth/login" : "/auth/register", values);
      const sessionReady = persistAuthSession(result);
      if (!sessionReady) {
        setNoticeKind("session-missing");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 404) {
          setNoticeKind("not-found");
          return;
        }
        setError(err.message);
        return;
      }
      // Network/timeout error — likely Render free-tier cold start
      setNoticeKind("cold-start");
      startRetryCountdown(values);
    }
  }

  function startRetryCountdown(values: z.infer<typeof schema>) {
    let secs = 30;
    setRetryCountdown(secs);
    const id = setInterval(() => {
      secs -= 1;
      setRetryCountdown(secs);
      if (secs <= 0) {
        clearInterval(id);
        // Auto-retry once after countdown
        setNoticeKind("");
        form.handleSubmit((v) => onSubmit(v))();
      }
    }, 1000);
  }

  function handleManualRetry() {
    setNoticeKind("");
    setRetryCountdown(0);
    if (lastValues.current) {
      onSubmit(lastValues.current as z.infer<typeof schema>);
    } else {
      form.handleSubmit(onSubmit)();
    }
  }

  function handleDemoMode() {
    persistAuthSession({
      accessToken: "mock-demo-token",
      user: { id: "demo-user", fullName: "Demo User", email: "demo@example.com", role: "job_seeker" },
    });
    router.push("/dashboard");
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Google OAuth — provider-ready placeholder. Not active until credentials configured. */}
        <div className="mb-4">
          {googleLive ? (
            <button
              type="button"
              onClick={() => {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
                window.location.href = API_URL + "/auth/google";
              }}
              className="flex w-full items-center justify-center gap-3 rounded-md border bg-background hover:bg-muted px-4 py-2.5 text-sm font-medium transition"
              aria-label="Continue with Google"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled
                title="Google sign-in will be available after provider credentials are configured."
                className="flex w-full items-center justify-center gap-3 rounded-md border bg-muted/50 px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60"
                aria-label="Continue with Google — coming soon"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google — coming soon
              </button>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                Google sign-in is provider-ready. Available after OAuth credentials are configured.
              </p>
            </>
          )}
        </div>
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Fix 2 confirmed: Full Name field exists for register mode */}
          {mode === "register" ? (
            <label className="block space-y-1 text-sm font-medium">
              <span>Full name</span>
              <Input placeholder="Asha Developer" autoComplete="name" {...form.register("fullName" as never)} />
              {(form.formState.errors as any).fullName?.message && (
                <p className="text-xs text-danger" role="alert">{(form.formState.errors as any).fullName.message as string}</p>
              )}
            </label>
          ) : null}
          {mode === "register" ? (
            <label className="block space-y-1 text-sm font-medium">
              <span>Phone</span>
              <Input placeholder="Optional phone number" autoComplete="tel" {...form.register("phone" as never)} />
              {(form.formState.errors as any).phone?.message && (
                <p className="text-xs text-danger" role="alert">{(form.formState.errors as any).phone.message as string}</p>
              )}
            </label>
          ) : null}
          <label className="block space-y-1 text-sm font-medium">
            <span>Email</span>
            <Input placeholder="you@example.com" type="email" autoComplete="email" {...form.register("email" as never)} />
            {(form.formState.errors as any).email?.message && (
              <p className="text-xs text-danger" role="alert">{(form.formState.errors as any).email.message as string}</p>
            )}
          </label>

          {/* Password field with Forgot password link in login mode (Fix 1) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="auth-password" className="text-sm font-medium">Password</label>
              {mode === "login" ? (
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-primary hover:underline"
                  data-testid="forgot-password-link"
                >
                  Forgot password?
                </Link>
              ) : null}
            </div>
            <Input
              id="auth-password"
              placeholder="At least 8 characters"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              {...form.register("password" as never)}
            />
            {(form.formState.errors as any).password?.message && (
              <p className="text-xs text-danger mt-1 font-semibold" role="alert" data-testid="password-error">
                {(form.formState.errors as any).password.message as string}
              </p>
            )}
            {mode === "register" ? (
              <div className="mt-2 rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground border" data-testid="password-guidance">
                <span className="font-semibold text-foreground">Password criteria:</span>
                <ul className="mt-1 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>Use at least 8 characters.</li>
                  <li>Include letters (both uppercase and lowercase) and numbers.</li>
                  <li>Avoid using your name or email.</li>
                  <li>Never reuse passwords from other sites.</li>
                </ul>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1" data-testid="login-password-note">
                Use the password you created during signup.
              </p>
            )}
          </div>

          {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}

          {/* Cold-start notice: friendly message for Render free-tier wake-up delay */}
          {noticeKind === "cold-start" ? (
            <div
              className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
              role="status"
            >
              <p className="font-semibold">🔄 Server is waking up&hellip;</p>
              <p className="mt-1 text-xs leading-relaxed">
                The backend runs on a free server that sleeps when idle. It takes
                <strong> 30–60 seconds</strong> to start.
                {retryCountdown > 0
                  ? ` Auto-retrying in ${retryCountdown}s…`
                  : " Retrying now…"}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
                onClick={handleManualRetry}
              >
                Try again now
              </Button>
              <div className="mt-2 border-t border-amber-200 pt-2">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Or browse without a real account:
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-1 w-full border-amber-400 bg-white text-amber-800 hover:bg-amber-100 text-xs"
                  onClick={handleDemoMode}
                >
                  Continue in Demo Mode (no real account)
                </Button>
              </div>
            </div>
          ) : noticeKind === "session-missing" ? (
            <div
              className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
              role="status"
            >
              <p>
                Authentication succeeded, but the server did not return a session token.
                Please check the backend configuration and try again.
              </p>
            </div>
          ) : noticeKind === "not-found" ? (
            <div
              className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
              role="status"
            >
              <p>The auth endpoint was not found. The backend may need to be redeployed.</p>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white hover:bg-amber-100 text-amber-900 border-amber-400"
                  onClick={handleDemoMode}
                >
                  Continue in Demo Mode (Local Mock Session)
                </Button>
              </div>
            </div>
          ) : null}

          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Please wait…"
              : mode === "login"
              ? "Login"
              : "Register"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <Link className="font-semibold text-primary hover:underline" href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Create an account" : "Login"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
