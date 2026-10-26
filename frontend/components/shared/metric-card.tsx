import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ label, value, icon, hint }: { label: string; value: ReactNode; icon?: ReactNode; hint?: string }) {
  return (
    <Card className="h-full">
      {/* h-full + mt-auto keeps values on one baseline across a grid row even when a label wraps. */}
      <CardContent className="flex h-full items-start justify-between gap-3 p-4">
        <div className="flex h-full min-w-0 flex-col">
          <p className="text-sm leading-snug text-muted-foreground">{label}</p>
          <div className="mt-auto pt-2 text-2xl font-bold tabular-nums">{value}</div>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="shrink-0 rounded-md bg-muted p-2 text-primary" aria-hidden="true">{icon}</div>
      </CardContent>
    </Card>
  );
}
