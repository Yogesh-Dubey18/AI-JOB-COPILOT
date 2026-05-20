import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ label, value, icon, hint }: { label: string; value: ReactNode; icon?: ReactNode; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-bold">{value}</div>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="rounded-md bg-muted p-2 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}
