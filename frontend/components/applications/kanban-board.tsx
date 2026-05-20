"use client";

import { applicationStatuses } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function KanbanBoard({ applications }: { applications: any[] }) {
  return (
    <div className="grid min-h-[420px] gap-3 overflow-x-auto pb-3 md:grid-flow-col md:auto-cols-[260px]">
      {applicationStatuses.map((status) => {
        const items = applications.filter((app) => app.status === status);
        return (
          <Card key={status} className="shadow-none">
            <CardHeader className="p-3"><CardTitle className="flex items-center justify-between text-sm">{status}<Badge>{items.length}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {items.map((app) => (
                <div key={app._id} className="rounded-md border bg-background p-3">
                  <p className="text-sm font-semibold">{app.role}</p>
                  <p className="text-xs text-muted-foreground">{app.company}</p>
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                    {app.followUpStatus ? <Badge className="bg-background">{app.followUpStatus}</Badge> : null}
                    {app.priorityScore ? <Badge className="bg-background">Priority {app.priorityScore}</Badge> : null}
                    {app.currentRound ? <Badge className="bg-background">{app.currentRound}</Badge> : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
