"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DragEvent } from "react";
import { applicationStatuses } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export function KanbanBoard({ applications }: { applications: any[] }) {
  const qc = useQueryClient();
  const moveApplication = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch("/applications/" + id + "/status", { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["applications"] });
      void qc.invalidateQueries({ queryKey: ["application-insights"] });
    }
  });

  const handleDragStart = (event: DragEvent<HTMLDivElement>, applicationId: string) => {
    event.dataTransfer.setData("application/id", applicationId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, status: string) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("application/id");
    const application = applications.find((item) => item._id === id);
    if (!id || application?.status === status) return;
    moveApplication.mutate({ id, status });
  };

  return (
    <div role="region" aria-label="Application pipeline board" className="grid min-h-[420px] gap-3 overflow-x-auto pb-3 md:grid-flow-col md:auto-cols-[260px]">
      {applicationStatuses.map((status) => {
        const items = applications.filter((app) => app.status === status);
        return (
          <Card
            key={status}
            className="shadow-none"
            role="group"
            aria-label={`${status} applications`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, status)}
          >
            <CardHeader className="p-3"><CardTitle className="flex items-center justify-between text-sm">{status}<Badge>{items.length}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {!items.length ? <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">No applications in this stage.</p> : null}
              {items.map((app) => (
                <div key={app._id} className="cursor-grab rounded-md border bg-background p-3 active:cursor-grabbing" draggable onDragStart={(event) => handleDragStart(event, app._id)}>
                  <p className="text-sm font-semibold">{app.role}</p>
                  <p className="text-xs text-muted-foreground">{app.company}</p>
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                    {app.matchScore ? <Badge className="bg-background">{app.matchScore}% match</Badge> : null}
                    {app.appliedDate ? <Badge className="bg-background">{new Date(app.appliedDate).toLocaleDateString()}</Badge> : null}
                    {app.followUpStatus ? <Badge className="bg-background">{app.followUpStatus}</Badge> : null}
                    {app.priorityScore ? <Badge className="bg-background">Priority {app.priorityScore}</Badge> : null}
                    {app.currentRound ? <Badge className="bg-background">{app.currentRound}</Badge> : null}
                  </div>
                  {app.notes ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{app.notes}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
