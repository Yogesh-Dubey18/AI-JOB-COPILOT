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
  const lastValues = useRef<z.infer<typeof loginSchema> | z.infer<typeof registerSchema> | null>(null);
  const schema = mode === "login" ? loginSchema : registerSchema;
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  // Ping backend on mount so Render starts warming before the user submits
  useEffect(() => {
    api.get("/health").catch(() => {});
  }, []);

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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {mode === "register" ? (
            <label className="block space-y-1 text-sm font-medium">
              <span>Full name</span>
              <Input placeholder="Asha Developer" autoComplete="name" {...form.register("fullName" as never)} />
            </label>
          ) : null}
          {mode === "register" ? (
            <label className="block space-y-1 text-sm font-medium">
              <span>Phone</span>
              <Input placeholder="Optional phone number" autoComplete="tel" {...form.register("phone" as never)} />
            </label>
          ) : null}
          <label className="block space-y-1 text-sm font-medium">
            <span>Email</span>
            <Input placeholder="you@example.com" type="email" autoComplete="email" {...form.register("email" as never)} />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Password</span>
            <Input
              placeholder="At least 8 characters"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              {...form.register("password" as never)}
            />
          </label>

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
