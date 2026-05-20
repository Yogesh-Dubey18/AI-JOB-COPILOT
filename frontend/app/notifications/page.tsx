"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => api.get<any[]>("/notifications"), retry: false });
  const readAll = useMutation({ mutationFn: () => api.patch("/notifications/read-all", {}), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }) });
  const items = notifications.data || [];
  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading title="Notifications" description="Follow-ups, interview reminders, job digests, and product updates." />
        <Button variant="outline" onClick={() => readAll.mutate()} disabled={readAll.isPending}>Mark all read</Button>
      </div>
      <div className="mt-5 space-y-3">
        {items.length ? items.map((item: any) => (
          <Card key={item._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">{item.message}</p></div>
                <span className="text-xs text-muted-foreground">{item.isRead ? "Read" : "New"}</span>
              </div>
            </CardContent>
          </Card>
        )) : <EmptyState title="No notifications yet" description="Your reminders and job-search alerts will appear here." />}
      </div>
    </AppShell>
  );
}
