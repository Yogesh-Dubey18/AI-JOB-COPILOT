"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import { persistAuthSession } from "@/lib/auth-session";
import { loginSchema, registerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const schema = mode === "login" ? loginSchema : registerSchema;
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    setError("");
    setNotice("");
    try {
      const result = await api.post(mode === "login" ? "/auth/login" : "/auth/register", values);
      const sessionReady = persistAuthSession(result);
      if (!sessionReady) {
        setNotice("Authentication succeeded, but this deployment did not return a browser session token. Please check the backend auth response configuration.");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 404) {
          setNotice("Demo-safe notice: the backend auth endpoint was not found for this deployment. No credentials were saved here.");
          return;
        }
        setError(err.message);
        return;
      }
      setNotice("Demo-safe notice: the backend auth service is currently unavailable. Check NEXT_PUBLIC_API_URL and try again. No credentials were saved here.");
    }
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
            <Input placeholder="At least 8 characters" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...form.register("password" as never)} />
          </label>
          {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
          {notice ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" role="status">
              <p>{notice}</p>
              {notice.includes("Demo-safe notice") && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white hover:bg-amber-100 text-amber-900 border-amber-400"
                    onClick={() => {
                      persistAuthSession({
                        accessToken: "mock-demo-token",
                        user: { id: "demo-user", fullName: "Demo User", email: "demo@example.com", role: "job_seeker" }
                      });
                      router.push("/dashboard");
                    }}
                  >
                    Continue in Demo Mode (Local Mock Session)
                  </Button>
                </div>
              )}
            </div>
          ) : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Register"}
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
