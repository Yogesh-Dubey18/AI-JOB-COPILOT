import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

function StateShell({
  title,
  description,
  action,
  className,
  role,
  icon
}: StateProps & { role: "status" | "alert"; icon: ReactNode }) {
  return (
    <div
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
      className={cn("rounded-md border bg-muted/40 p-4 text-sm sm:p-5", className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{title}</p>
          {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function LoadingState({ title = "Loading", description, className }: Partial<StateProps>) {
  return <StateShell role="status" title={title} description={description} className={className} icon={<Loader2 className="h-5 w-5 animate-spin" />} />;
}

export function EmptyState({ title, description, action, className }: StateProps) {
  return <StateShell role="status" title={title} description={description} action={action} className={className} icon={<Inbox className="h-5 w-5" />} />;
}

export function ErrorState({ title = "Something went wrong", description, action, className }: Partial<StateProps>) {
  return (
    <StateShell
      role="alert"
      title={title}
      description={description || "Try again, or check that the backend is running with the expected environment variables."}
      action={action}
      className={className}
      icon={<AlertTriangle className="h-5 w-5 text-danger" />}
    />
  );
}

export function RetryButton({ onClick, label = "Retry" }: { onClick: () => void; label?: string }) {
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      {label}
    </Button>
  );
}
