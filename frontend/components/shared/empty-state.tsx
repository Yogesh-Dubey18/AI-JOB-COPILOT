import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <h3 className="font-bold">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
