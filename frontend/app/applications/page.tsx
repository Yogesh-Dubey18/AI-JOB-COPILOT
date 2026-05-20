"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { KanbanBoard } from "@/components/applications/kanban-board";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const apps = useQuery({ queryKey: ["applications"], queryFn: () => api.get<any[]>("/applications"), retry: false });
  const create = useMutation({ mutationFn: (data: FormData) => api.post("/applications", { company: data.get("company"), role: data.get("role"), status: "Applied", applicationSource: data.get("source") }), onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }) });
  return (
    <AppShell>
      <PageHeading title="Application tracker" description="Track every role across saved, applied, rounds, offer, selected, rejected, and withdrawn stages in Kanban or table form." />
      <Card className="mb-5">
        <CardHeader><CardTitle>Add manual application</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate(new FormData(event.currentTarget));
            }}
            className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <Input name="company" placeholder="Company" />
            <Input name="role" placeholder="Role" />
            <Input name="source" placeholder="Source" />
            <Button><Plus className="h-4 w-4" /> Add</Button>
          </form>
        </CardContent>
      </Card>
      <KanbanBoard applications={apps.data || []} />
    </AppShell>
  );
}
