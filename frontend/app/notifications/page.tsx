"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CalendarClock, Mail } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => api.get<any[]>("/notifications"), retry: false });
  const preferences = useQuery({ queryKey: ["notification-preferences"], queryFn: () => api.get<any>("/notifications/preferences"), retry: false });
  const readAll = useMutation({ mutationFn: () => api.patch("/notifications/read-all", {}), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }) });
  const scanReminders = useMutation({ mutationFn: () => api.post<any>("/notifications/reminders/applications", {}), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }) });
  const updatePreferences = useMutation({ mutationFn: (data: any) => api.patch("/notifications/preferences", data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }) });
  const items = notifications.data || [];
  const unread = items.filter((item: any) => !item.isRead).length;
  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading title="Notifications" description="Follow-ups, interview reminders, job digests, and product updates." />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => scanReminders.mutate()} disabled={scanReminders.isPending}>Scan reminders</Button>
          <Button variant="outline" onClick={() => readAll.mutate()} disabled={readAll.isPending}>Mark all read</Button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><BellRing className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Unread</p><p className="text-2xl font-bold">{unread}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Mail className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Email reminders</p><p className="text-2xl font-bold">{preferences.data?.email ? "On" : "Off"}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><CalendarClock className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Calendar</p><p className="text-2xl font-bold">{preferences.data?.calendar ? "On" : "Off"}</p></div></CardContent></Card>
      </div>
      <Card className="mt-5">
        <CardHeader><CardTitle className="text-base">Notification preferences</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["email", "calendar", "dailyDigest", "applicationReminders", "interviewReminders"].map((key) => (
            <Button key={key} variant={preferences.data?.[key] ? "primary" : "outline"} onClick={() => updatePreferences.mutate({ [key]: !preferences.data?.[key] })}>{key}</Button>
          ))}
        </CardContent>
      </Card>
      <div className="mt-5 space-y-3">
        {items.length ? items.map((item: any) => (
          <Card key={item._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.title}</p><Badge>{item.priority || "normal"}</Badge></div><p className="text-sm text-muted-foreground">{item.message}</p></div>
                <span className="text-xs text-muted-foreground">{item.isRead ? "Read" : "New"}</span>
              </div>
            </CardContent>
          </Card>
        )) : <EmptyState title="No notifications yet" description="Your reminders and job-search alerts will appear here." />}
      </div>
    </AppShell>
  );
}
