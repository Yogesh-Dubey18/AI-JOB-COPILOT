"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CopyBlock({ title, value }: { title: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <Button
          type="button"
          title={copied ? "Copied!" : "Copy " + title}
          aria-label={copied ? `Copied ${title} to clipboard` : `Copy ${title} to clipboard`}
          variant="outline"
          className="w-10 px-0"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </Button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? `${title} copied to clipboard` : ""}
        </span>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
