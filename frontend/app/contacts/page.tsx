"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarClock, Link2, Mail, Phone, Plus, User2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function ContactsPage() {
  const qc = useQueryClient();
  const contacts = useQuery({
    queryKey: ["contacts"],
    queryFn: () => api.get<any[]>("/contacts"),
    retry: false
  });
  const create = useMutation({
    mutationFn: (data: FormData) =>
      api.post("/contacts", {
        name: data.get("name"),
        company: data.get("company"),
        role: data.get("role"),
        contactType: data.get("contactType"),
        email: data.get("email"),
        phone: data.get("phone"),
        linkedinUrl: data.get("linkedinUrl"),
        notes: data.get("notes"),
        followUpDate: data.get("followUpDate") || undefined,
        lastContactedDate: data.get("lastContactedDate") || undefined
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] })
  });

  function isOverdue(dateStr?: string) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  return (
    <AppShell>
      <PageHeading
        title="Recruiter contacts"
        description="Track hiring managers, recruiters, and referral contacts. Log names, companies, emails, LinkedIn URLs, and follow-up notes."
      />
      <Card className="mb-5">
        <CardHeader><CardTitle>Add contact</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); }}
            className="grid gap-3 md:grid-cols-3"
          >
            <Input aria-label="Contact name" name="name" placeholder="Full name" required />
            <Input aria-label="Company" name="company" placeholder="Company" />
            <Input aria-label="Role" name="role" placeholder="Their role (e.g. Recruiter)" />
            <select name="contactType" aria-label="Contact type" className="col-span-1 rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">Type (optional)</option>
              <option value="Recruiter">Recruiter</option>
              <option value="Hiring Manager">Hiring Manager</option>
              <option value="Referral">Referral</option>
              <option value="Mentor">Mentor</option>
            </select>
            <Input aria-label="Email" name="email" type="email" placeholder="Email" />
            <Input aria-label="Phone" name="phone" placeholder="Phone" />
            <Input aria-label="LinkedIn URL" name="linkedinUrl" placeholder="LinkedIn URL" />
            <Input aria-label="Last contacted" name="lastContactedDate" type="date" placeholder="Last contacted" />
            <Input aria-label="Follow-up date" name="followUpDate" type="date" placeholder="Follow-up date" />
            <Input aria-label="Notes" name="notes" placeholder="Notes (follow-up status, referral, etc.)" className="md:col-span-1" />
            <Button type="submit" disabled={create.isPending} aria-busy={create.isPending}>
              <Plus className="h-4 w-4" /> {create.isPending ? "Adding..." : "Add contact"}
            </Button>
          </form>
          {create.isError ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {create.error instanceof Error ? create.error.message : "Could not add contact."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {contacts.isLoading ? <LoadingState title="Loading contacts" description="Fetching your recruiter and referral contact list." /> : null}
      {contacts.isError ? <ErrorState description={contacts.error instanceof Error ? contacts.error.message : "Could not load contacts."} action={<RetryButton onClick={() => contacts.refetch()} />} /> : null}
      {!contacts.isLoading && !contacts.isError && !(contacts.data || []).length ? (
        <EmptyState title="No contacts yet" description="Add recruiters, hiring managers, and referral contacts to track your network." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(contacts.data || []).map((contact: any) => (
          <Card key={contact._id} className={isOverdue(contact.followUpDate) ? "border-amber-400" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span className="flex items-center gap-2"><User2 className="h-4 w-4 text-primary" />{contact.name}</span>
                {contact.contactType ? <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{contact.contactType}</span> : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {contact.company && (
                <p className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{contact.company} {contact.role ? `· ${contact.role}` : ""}</p>
              )}
              {contact.email && (
                <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{contact.email}</p>
              )}
              {contact.phone && (
                <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{contact.phone}</p>
              )}
              {contact.linkedinUrl && (
                <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                  <Link2 className="h-3.5 w-3.5" />LinkedIn
                </a>
              )}
              {(contact.lastContactedDate || contact.followUpDate) ? (
                <div className="space-y-1">
                  {contact.lastContactedDate ? <p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />Last contacted: {new Date(contact.lastContactedDate).toLocaleDateString()}</p> : null}
                  {contact.followUpDate ? <p className={`flex items-center gap-2 text-xs font-semibold ${isOverdue(contact.followUpDate) ? "text-amber-600" : "text-muted-foreground"}`}><CalendarClock className="h-3.5 w-3.5" />Follow-up: {new Date(contact.followUpDate).toLocaleDateString()}{isOverdue(contact.followUpDate) ? " ⚠ overdue" : ""}</p> : null}
                </div>
              ) : null}
              {contact.notes && (
                <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">{contact.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
