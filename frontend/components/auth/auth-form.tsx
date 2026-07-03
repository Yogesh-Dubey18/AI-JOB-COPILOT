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
import { Eye, EyeOff, Check, X, AlertCircle, Loader2, Shield } from "lucide-react";

type NoticeKind = "cold-start" | "session-missing" | "not-found" | "";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [noticeKind, setNoticeKind] = useState<NoticeKind>("");
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [googleLive, setGoogleLive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [shouldShake, setShouldShake] = useState(false);

  const lastValues = useRef<z.infer<typeof loginSchema> | z.infer<typeof registerSchema> | null>(null);
  const schema = mode === "login" ? loginSchema : registerSchema;
  
  const form = useForm<z.infer<typeof schema>>({ 
    resolver: zodResolver(schema),
    mode: "onChange" // Validate in real-time
  });

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

  const onInvalidSubmit = (errors?: any) => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 500);
  };

  async function onSubmit(values: z.infer<typeof schema>) {
    setError("");
    setNoticeKind("");
    lastValues.current = values;

    if (mode === "register" && confirmPassword !== (values as any).password) {
      setError("Passwords do not match");
      onInvalidSubmit();
      return;
    }

    try {
      const result = await api.post(mode === "login" ? "/auth/login" : "/auth/register", values);
      const sessionReady = persistAuthSession(result);
      if (!sessionReady) {
        setNoticeKind("session-missing");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      onInvalidSubmit();
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

  // Real-time email validation
  const emailValue = form.watch("email") || "";
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  const emailError = (form.formState.errors as any).email;

  // Real-time password criteria & strength checking
  const passwordValue = form.watch("password") || "";
  const passwordError = (form.formState.errors as any).password;
  
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue);

  const rules = [
    { label: "At least 8 characters", met: hasMinLength },
    { label: "One uppercase letter", met: hasUppercase },
    { label: "One number", met: hasNumber },
    { label: "One special character (!@#$...)", met: hasSpecial }
  ];

  let strengthScore = 0;
  if (hasMinLength) strengthScore++;
  if (hasUppercase) strengthScore++;
  if (hasNumber) strengthScore++;
  if (hasSpecial) strengthScore++;

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "bg-rose-500", "bg-amber-500", "bg-yellow-500", "bg-emerald-500"];

  // Real-time confirm password check
  const passwordsMatch = passwordValue === confirmPassword && confirmPassword.length > 0;
  const showMismatchError = confirmPassword.length > 0 && passwordValue !== confirmPassword;

  const isSubmitDisabled = form.formState.isSubmitting || (mode === "register" && !agreeTerms);

  return (
    <main className="min-h-screen w-full flex bg-background">
      {/* LEFT PANEL: 40% width, desktop only */}
      <div className="hidden md:flex md:w-[40%] bg-gradient-to-br from-[#0f766e] via-[#115e59] to-[#1e1b4b] text-white p-12 flex-col justify-between relative overflow-hidden animate-gradient-shift">
        {/* Animated aura background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-72 h-72 rounded-full bg-teal-400 blur-3xl animate-drift-slow" />
          <div className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full bg-indigo-500 blur-3xl animate-drift-slow" style={{ animationDelay: "-5s" }} />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Product logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
              <Shield className="h-5 w-5 text-teal-300" />
            </div>
            <span className="text-xl font-bold tracking-tight">AI Job Copilot</span>
          </div>

          {/* Tagline */}
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Your AI-powered career operating system
            </h1>
            <p className="text-teal-100/80 text-sm max-w-sm font-light leading-relaxed">
              Automate resume tailoring, live job matching, and mock interviews to land your next role faster.
            </p>
          </div>

          {/* 3 feature highlights with icons */}
          <div className="space-y-6 pt-6">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                <Check className="h-3.5 w-3.5 text-teal-300" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">ATS-optimized resume tailoring</h3>
                <p className="text-xs text-teal-200/70 mt-0.5 font-light leading-relaxed">
                  Pass screening algorithms naturally without inventing metrics or experience.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                <Check className="h-3.5 w-3.5 text-teal-300" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Real-time job matching</h3>
                <p className="text-xs text-teal-200/70 mt-0.5 font-light leading-relaxed">
                  Scan 1000+ curated postings scoring matches directly on your unique strengths.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                <Check className="h-3.5 w-3.5 text-teal-300" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">AI interview prep</h3>
                <p className="text-xs text-teal-200/70 mt-0.5 font-light leading-relaxed">
                  Practice custom mock interviews with instant scoring and talking points.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="relative z-10 border-t border-white/10 pt-6 flex flex-col gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full backdrop-blur-md border border-teal-500/20">
              Private Beta
            </span>
          </div>
          <p className="text-xs text-teal-200/70 font-light">Join 500+ job seekers in private beta.</p>
        </div>
      </div>

      {/* RIGHT PANEL: 60% width (desktop) / full width (mobile) */}
      <div className="w-full md:w-[60%] flex flex-col justify-center items-center py-12 px-4 sm:px-6 bg-slate-50/50 dark:bg-[#0b0f19]/40 relative overflow-y-auto">
        
        {/* Mobile Header Logo */}
        <div className="flex md:hidden items-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#0f766e] dark:text-teal-400">AI Job Copilot</span>
        </div>

        <div className={`w-full max-w-md space-y-6 animate-fade-in-up ${shouldShake ? "animate-shake" : ""}`}>
          <Card className="border-border shadow-xl backdrop-blur-sm bg-card/85">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight text-center md:text-left">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center md:text-left text-balance">
                {mode === "login" ? "Enter your email to sign in to your dashboard" : "Get started with your free beta account"}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Google OAuth Provider */}
              <div className="w-full">
                {googleLive ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/api/auth/google";
                    }}
                    className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background hover:bg-muted/70 px-4 py-2.5 text-sm font-medium transition duration-200 shadow-sm"
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
                  <div className="group relative w-full">
                    <button
                      type="button"
                      disabled
                      className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60 transition"
                      aria-label="Continue with Google — coming soon"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-xs bg-slate-900 text-white text-xs rounded px-3 py-2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-30 shadow-lg text-center font-normal">
                      Google sign-in — coming soon<br />
                      <span className="text-[10px] text-slate-300 font-light">OAuth credentials being configured</span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-slate-900"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2.5 text-muted-foreground font-light">or continue with email</span>
                </div>
              </div>

              {/* Form Input fields */}
              <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-4">
                
                {/* General Error Banner */}
                {error && (
                  <div
                    className="flex items-start gap-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 transition-all duration-300 animate-fade-in-up"
                    role="alert"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                    <div className="flex-1 text-sm font-medium text-left">
                      {error}
                    </div>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="text-rose-600 hover:text-rose-800 transition"
                      aria-label="Dismiss error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Cold start notice */}
                {noticeKind === "cold-start" && (
                  <div
                    className="rounded-md border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/20 dark:text-amber-200 space-y-2 animate-fade-in-up"
                    role="status"
                  >
                    <p className="font-semibold flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
                      Server is waking up...
                    </p>
                    <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/80 text-left">
                      The backend runs on a free server that sleeps when idle. It takes
                      <strong> 30–60 seconds</strong> to start.
                      {retryCountdown > 0
                        ? ` Auto-retrying in ${retryCountdown}s...`
                        : " Retrying now..."}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-amber-400 bg-white hover:bg-amber-50 text-amber-900 text-xs"
                      onClick={handleManualRetry}
                    >
                      Try again now
                    </Button>
                    <div className="border-t border-amber-200/60 dark:border-amber-800/40 pt-2 space-y-1.5 text-left">
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Or browse without a real account:
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full border-amber-400 bg-white hover:bg-amber-50 text-amber-800 text-xs"
                        onClick={handleDemoMode}
                      >
                        Continue in Demo Mode (no real account)
                      </Button>
                    </div>
                  </div>
                )}

                {/* Session missing notice */}
                {noticeKind === "session-missing" && (
                  <div
                    className="rounded-md border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/20 dark:text-amber-200 animate-fade-in-up"
                    role="status"
                  >
                    <p className="text-xs leading-relaxed text-left">
                      Authentication succeeded, but the server did not return a session token.
                      Please check the backend configuration and try again.
                    </p>
                  </div>
                )}

                {/* Endpoint not found notice */}
                {noticeKind === "not-found" && (
                  <div
                    className="rounded-md border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/20 dark:text-amber-200 space-y-2 animate-fade-in-up"
                    role="status"
                  >
                    <p className="text-xs text-left">The auth endpoint was not found. The backend may need to be redeployed.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-white hover:bg-amber-50 text-amber-900 border-amber-400 text-xs"
                      onClick={handleDemoMode}
                    >
                      Continue in Demo Mode (Local Mock Session)
                    </Button>
                  </div>
                )}
                
                {/* Full name (Register Mode) */}
                {mode === "register" && (
                  <div className="space-y-1">
                    <div className="relative">
                      <Input
                        id="auth-fullname"
                        placeholder="Asha Developer"
                        className={`peer block w-full rounded-md border bg-transparent px-3 pt-5 pb-1 text-sm focus:outline-none focus:ring-1 placeholder-transparent ${
                          (form.formState.errors as any).fullName
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                            : "border-input focus:border-teal-600 focus:ring-teal-600"
                        }`}
                        autoComplete="name"
                        {...form.register("fullName" as never)}
                      />
                      <label
                        htmlFor="auth-fullname"
                        className={`absolute left-3 top-1 z-10 origin-[0] -translate-y-2.5 scale-75 transform bg-card px-1 text-xs duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1 peer-focus:-translate-y-2.5 peer-focus:scale-75 pointer-events-none ${
                          (form.formState.errors as any).fullName
                            ? "text-rose-500 peer-focus:text-rose-500"
                            : "text-muted-foreground peer-focus:text-teal-600"
                        }`}
                      >
                        Full name
                      </label>
                    </div>
                    {(form.formState.errors as any).fullName?.message && (
                      <p className="text-[11px] text-rose-500 font-semibold pl-1" role="alert">
                        {(form.formState.errors as any).fullName.message as string}
                      </p>
                    )}
                  </div>
                )}

                {/* Phone (Register Mode) */}
                {mode === "register" && (
                  <div className="space-y-1">
                    <div className="relative">
                      <Input
                        id="auth-phone"
                        placeholder="Optional phone number"
                        className={`peer block w-full rounded-md border bg-transparent px-3 pt-5 pb-1 text-sm focus:outline-none focus:ring-1 placeholder-transparent ${
                          (form.formState.errors as any).phone
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                            : "border-input focus:border-teal-600 focus:ring-teal-600"
                        }`}
                        autoComplete="tel"
                        {...form.register("phone" as never)}
                      />
                      <label
                        htmlFor="auth-phone"
                        className={`absolute left-3 top-1 z-10 origin-[0] -translate-y-2.5 scale-75 transform bg-card px-1 text-xs duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1 peer-focus:-translate-y-2.5 peer-focus:scale-75 pointer-events-none ${
                          (form.formState.errors as any).phone
                            ? "text-rose-500 peer-focus:text-rose-500"
                            : "text-muted-foreground peer-focus:text-teal-600"
                        }`}
                      >
                        Phone (optional)
                      </label>
                    </div>
                    {(form.formState.errors as any).phone?.message && (
                      <p className="text-[11px] text-rose-500 font-semibold pl-1" role="alert">
                        {(form.formState.errors as any).phone.message as string}
                      </p>
                    )}
                  </div>
                )}

                {/* Email field with validation icon */}
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="auth-email"
                      type="email"
                      placeholder="you@example.com"
                      className={`peer block w-full rounded-md border bg-transparent px-3 pt-5 pb-1 pr-10 text-sm focus:outline-none focus:ring-1 placeholder-transparent ${
                        emailError
                          ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                          : "border-input focus:border-teal-600 focus:ring-teal-600"
                      }`}
                      autoComplete="email"
                      {...form.register("email" as never)}
                    />
                    <label
                      htmlFor="auth-email"
                      className={`absolute left-3 top-1 z-10 origin-[0] -translate-y-2.5 scale-75 transform bg-card px-1 text-xs duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1 peer-focus:-translate-y-2.5 peer-focus:scale-75 pointer-events-none ${
                        emailError
                          ? "text-rose-500 peer-focus:text-rose-500"
                          : "text-muted-foreground peer-focus:text-teal-600"
                      }`}
                    >
                      Email
                    </label>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      {isEmailValid && !emailError && <Check className="h-4 w-4 text-emerald-500" />}
                      {emailError && <AlertCircle className="h-4 w-4 text-rose-500" />}
                    </div>
                  </div>
                  {emailError?.message && (
                    <p className="text-[11px] text-rose-500 font-semibold pl-1" role="alert">
                      {emailError.message as string}
                    </p>
                  )}
                </div>

                {/* Password field with show/hide toggle */}
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      className={`peer block w-full rounded-md border bg-transparent px-3 pt-5 pb-1 pr-10 text-sm focus:outline-none focus:ring-1 placeholder-transparent ${
                        passwordError
                          ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                          : "border-input focus:border-teal-600 focus:ring-teal-600"
                      }`}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      {...form.register("password" as never)}
                    />
                    <label
                      htmlFor="auth-password"
                      className={`absolute left-3 top-1 z-10 origin-[0] -translate-y-2.5 scale-75 transform bg-card px-1 text-xs duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1 peer-focus:-translate-y-2.5 peer-focus:scale-75 pointer-events-none ${
                        passwordError
                          ? "text-rose-500 peer-focus:text-rose-500"
                          : "text-muted-foreground peer-focus:text-teal-600"
                      }`}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground hover:text-foreground transition duration-150"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordError?.message && (
                    <p className="text-[11px] text-rose-500 font-semibold pl-1" role="alert" data-testid="password-error">
                      {passwordError.message as string}
                    </p>
                  )}

                  {/* Password Note (Login) or Password Checklist/Strength (Register) */}
                  {mode === "login" ? (
                    <p className="text-[11px] text-muted-foreground pl-1 mt-0.5" data-testid="login-password-note">
                      Use the password you created during signup.
                    </p>
                  ) : (
                    <div className="space-y-2 pt-1.5" data-testid="password-guidance">
                      {/* Strength segments */}
                      <div className="flex gap-1 h-1 rounded-full overflow-hidden bg-muted/60">
                        {[1, 2, 3, 4].map((idx) => (
                          <div
                            key={idx}
                            className={`flex-1 h-full transition-all duration-300 ${
                              idx <= strengthScore ? strengthColors[strengthScore] : ""
                            }`}
                          />
                        ))}
                      </div>
                      {passwordValue && (
                        <p className="text-[11px] font-bold leading-none" style={{ color: strengthScore === 1 ? '#ef4444' : strengthScore === 2 ? '#f59e0b' : strengthScore === 3 ? '#eab308' : strengthScore === 4 ? '#10b981' : '#6b7280' }}>
                          Password Strength: {strengthLabels[strengthScore]}
                        </p>
                      )}

                      {/* Criteria rules */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-muted/30 border border-border/40 rounded-md p-2.5 mt-1.5">
                        {rules.map((rule) => (
                          <div key={rule.label} className="flex items-center gap-1.5 text-[10px]">
                            {rule.met ? (
                              <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            ) : (
                              <X className="h-3 w-3 text-rose-400 shrink-0" />
                            )}
                            <span className={rule.met ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-muted-foreground/80"}>
                              {rule.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password (Register Mode) */}
                {mode === "register" && (
                  <div className="space-y-1">
                    <div className="relative">
                      <Input
                        id="auth-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        className={`peer block w-full rounded-md border bg-transparent px-3 pt-5 pb-1 pr-10 text-sm focus:outline-none focus:ring-1 placeholder-transparent ${
                          showMismatchError
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                            : "border-input focus:border-teal-600 focus:ring-teal-600"
                        }`}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <label
                        htmlFor="auth-confirm-password"
                        className={`absolute left-3 top-1 z-10 origin-[0] -translate-y-2.5 scale-75 transform bg-card px-1 text-xs duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1 peer-focus:-translate-y-2.5 peer-focus:scale-75 pointer-events-none ${
                          showMismatchError
                            ? "text-rose-500 peer-focus:text-rose-500"
                            : "text-muted-foreground peer-focus:text-teal-600"
                        }`}
                      >
                        Confirm password
                      </label>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {passwordsMatch && <Check className="h-4 w-4 text-emerald-500" />}
                        {showMismatchError && <X className="h-4 w-4 text-rose-500" />}
                      </div>
                    </div>
                    {showMismatchError && (
                      <p className="text-[11px] text-rose-500 font-semibold pl-1" role="alert">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                )}

                {/* Remember me & Forgot Password / Terms Checkbox */}
                {mode === "login" ? (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                      />
                      <label htmlFor="remember-me" className="text-xs text-muted-foreground cursor-pointer select-none">
                        Remember me
                      </label>
                    </div>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-teal-600 hover:text-teal-500 font-semibold hover:underline"
                      data-testid="forgot-password-link"
                    >
                      Forgot password?
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="agree-terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                      required
                    />
                    <label htmlFor="agree-terms" className="text-[11px] text-muted-foreground leading-normal cursor-pointer select-none">
                      I agree to the{" "}
                      <Link href="/terms" className="text-teal-600 hover:text-teal-500 font-semibold hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-teal-600 hover:text-teal-500 font-semibold hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  className="w-full bg-gradient-to-r from-[#0f766e] to-[#0d9488] hover:from-[#115e59] hover:to-[#0f766e] text-white py-2.5 mt-2 rounded-md font-semibold transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md"
                  disabled={isSubmitDisabled}
                >
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {mode === "login" ? "Signing in..." : "Registering..."}
                    </span>
                  ) : mode === "login" ? (
                    "Login"
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>

              {/* Bottom Nav Redirect */}
              <div className="pt-2 text-center text-sm">
                <span className="text-muted-foreground">
                  {mode === "login" ? "New here?" : "Already have an account?"}
                </span>{" "}
                <Link
                  className="font-semibold text-teal-600 hover:text-teal-500 hover:underline"
                  href={mode === "login" ? "/register" : "/login"}
                >
                  {mode === "login" ? "Create an account" : "Login"}
                </Link>
              </div>

            </CardContent>
          </Card>

          {/* Page Footer outside Card */}
          <div className="text-center space-y-1">
            <p className="text-[10px] text-muted-foreground/80">
              Protected by JWT auth · Privacy Policy · Terms
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
