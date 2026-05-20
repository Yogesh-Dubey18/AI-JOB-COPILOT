"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import { loginSchema, registerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const schema = mode === "login" ? loginSchema : registerSchema;
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    setError("");
    try {
      await api.post(mode === "login" ? "/auth/login" : "/auth/register", values);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader><CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {mode === "register" ? <Input placeholder="Full name" {...form.register("fullName" as never)} /> : null}
          {mode === "register" ? <Input placeholder="Phone" {...form.register("phone" as never)} /> : null}
          <Input placeholder="Email" type="email" {...form.register("email" as never)} />
          <Input placeholder="Password" type="password" {...form.register("password" as never)} />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Register"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
