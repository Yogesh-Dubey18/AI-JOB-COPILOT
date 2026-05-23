"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Calendar, CheckCircle2, Info, Mail, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const FREQUENCIES = ["instant", "daily", "weekly", "off"] as const;
const DELAY_OPTIONS = [3, 5, 7, 14] as const;
const REMINDER_TIMINGS = ["24h before", "3h before", "1h before"] as const;

interface Prefs {
  jobMatchAlertsEnabled: boolean;
  minimumMatchScore: number;
  jobAlertFrequency: string;
  followUpRemindersEnabled: boolean;
  defaultFollowUpDelayDays: number;
  interviewRemindersEnabled: boolean;
  reminderTimings: string[];
  staleApplicationDays: number;
  staleApplicationRemindersEnabled: boolean;
  emailNotificationsEnabled: boolean;
  calendarRemindersEnabled: boolean;
  dashboardNotificationsEnabled: boolean;
}

const DEFAULT_PREFS: Prefs = {
  jobMatchAlertsEnabled: true,
  minimumMatchScore: 60,
  jobAlertFrequency: "daily",
  followUpRemindersEnabled: true,
  defaultFollowUpDelayDays: 5,
  interviewRemindersEnabled: true,
  reminderTimings: ["24h before"],
  staleApplicationDays: 14,
  staleApplicationRemindersEnabled: true,
  emailNotificationsEnabled: false,
  calendarRemindersEnabled: false,
  dashboardNotificationsEnabled: true
};

function Toggle({ checked, onChange, id, label }: { checked: boolean; onChange: (v: boolean) => void; id: string; label: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </label>
  );
}

export default function NotificationPreferencesPage() {
  const qc = useQueryClient();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  const prefQuery = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => api.get<Prefs>("/notifications/preferences"),
    retry: false
  });

  useEffect(() => {
    if (prefQuery.data) setPrefs({ ...DEFAULT_PREFS, ...prefQuery.data });
  }, [prefQuery.data]);

  const save = useMutation({
    mutationFn: () => api.patch("/notifications/preferences", prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-preferences"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  });

  function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function toggleTiming(timing: string) {
    setPrefs((p) => ({
      ...p,
      reminderTimings: p.reminderTimings.includes(timing)
        ? p.reminderTimings.filter((t) => t !== timing)
        : [...p.reminderTimings, timing]
    }));
  }

  if (prefQuery.isLoading) return <AppShell><LoadingState title="Loading preferences" description="Fetching your notification settings." /></AppShell>;
  if (prefQuery.isError) return <AppShell><ErrorState description="Could not load notification preferences." action={<RetryButton onClick={() => prefQuery.refetch()} />} /></AppShell>;

  return (
    <AppShell>
      <PageHeading title="Notification preferences" description="Control job alerts, follow-up reminders, interview reminders, and notification channels." />

      {/* Provider status */}
      <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Notification channel status</p>
            <ul className="mt-1 space-y-0.5">
              <li>✅ Dashboard notifications — live</li>
              <li>⚠️ Email notifications — provider-ready (set <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">SENDGRID_API_KEY</code> in backend .env)</li>
              <li>⚠️ Calendar reminders — provider-ready (set <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">GOOGLE_CALENDAR_*</code> env vars)</li>
              <li>⚠️ Browser push — provider-ready (set up web push credentials)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Job match alerts */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" />Job match alerts</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle id="job-alerts" checked={prefs.jobMatchAlertsEnabled} onChange={(v) => set("jobMatchAlertsEnabled", v)} label="Enable new job match alerts" />
            {prefs.jobMatchAlertsEnabled && (
              <>
                <div>
                  <label htmlFor="min-score" className="mb-1 block text-sm font-medium">Minimum match score (%)</label>
                  <Input id="min-score" type="number" min={0} max={100} value={prefs.minimumMatchScore} onChange={(e) => set("minimumMatchScore", Number(e.target.value))} className="max-w-xs" aria-label="Minimum match score" />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Alert frequency</p>
                  <div className="flex flex-wrap gap-2">
                    {FREQUENCIES.map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        aria-pressed={prefs.jobAlertFrequency === freq}
                        onClick={() => set("jobAlertFrequency", freq)}
                        className={`rounded-md border px-3 py-1.5 text-sm font-medium capitalize transition ${prefs.jobAlertFrequency === freq ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Follow-up reminders */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" />Follow-up reminders</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle id="followup" checked={prefs.followUpRemindersEnabled} onChange={(v) => set("followUpRemindersEnabled", v)} label="Enable follow-up reminders" />
            {prefs.followUpRemindersEnabled && (
              <div>
                <p className="mb-2 text-sm font-medium">Default follow-up delay (days after applying)</p>
                <div className="flex flex-wrap gap-2">
                  {DELAY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={prefs.defaultFollowUpDelayDays === d}
                      onClick={() => set("defaultFollowUpDelayDays", d)}
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${prefs.defaultFollowUpDelayDays === d ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interview reminders */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4" />Interview reminders</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle id="interview-reminders" checked={prefs.interviewRemindersEnabled} onChange={(v) => set("interviewRemindersEnabled", v)} label="Enable interview reminders" />
            {prefs.interviewRemindersEnabled && (
              <div>
                <p className="mb-2 text-sm font-medium">Reminder timing</p>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_TIMINGS.map((timing) => (
                    <button
                      key={timing}
                      type="button"
                      aria-pressed={prefs.reminderTimings.includes(timing)}
                      onClick={() => toggleTiming(timing)}
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${prefs.reminderTimings.includes(timing) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      {timing}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stale application reminders */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" />Stale application reminders</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle id="stale-reminders" checked={prefs.staleApplicationRemindersEnabled} onChange={(v) => set("staleApplicationRemindersEnabled", v)} label="Remind me about applications with no response" />
            {prefs.staleApplicationRemindersEnabled && (
              <div>
                <label htmlFor="stale-days" className="mb-1 block text-sm font-medium">Mark application stale after (days)</label>
                <Input id="stale-days" type="number" min={7} max={90} value={prefs.staleApplicationDays} onChange={(e) => set("staleApplicationDays", Number(e.target.value))} className="max-w-xs" aria-label="Stale application days" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification channels */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" />Notification channels</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle id="dashboard-notifs" checked={prefs.dashboardNotificationsEnabled} onChange={(v) => set("dashboardNotificationsEnabled", v)} label="Dashboard notifications (live)" />
            <div className="space-y-2 opacity-60">
              <Toggle id="email-notifs" checked={prefs.emailNotificationsEnabled} onChange={(v) => set("emailNotificationsEnabled", v)} label="Email notifications (provider-ready — configure SENDGRID_API_KEY)" />
              <Toggle id="calendar-reminders" checked={prefs.calendarRemindersEnabled} onChange={(v) => set("calendarRemindersEnabled", v)} label="Calendar reminders (provider-ready — configure GOOGLE_CALENDAR_*)" />
              <p className="text-xs text-muted-foreground">Email and calendar require backend env vars to be configured. Enabling the toggle stores your preference but will not activate until the provider is set up.</p>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-4 w-4" />
            {save.isPending ? "Saving..." : "Save preferences"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600" role="status">
              <CheckCircle2 className="h-4 w-4" /> Preferences saved
            </span>
          )}
          {save.isError && (
            <p role="alert" className="text-sm text-danger">
              {save.error instanceof Error ? save.error.message : "Could not save preferences."}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
