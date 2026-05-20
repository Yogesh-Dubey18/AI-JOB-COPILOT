"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CopyBlock({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <Button title={"Copy " + title} variant="outline" className="w-10 px-0" onClick={() => navigator.clipboard?.writeText(value)}>
          <Copy className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
