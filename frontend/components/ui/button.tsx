import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", ...props }, ref) => {
  const variants: Record<Variant, string> = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-accent text-accent-foreground hover:opacity-90",
    outline: "border bg-transparent hover:bg-muted",
    ghost: "hover:bg-muted",
    danger: "bg-danger text-white hover:opacity-90"
  };
  return <button ref={ref} className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60", variants[variant], className)} {...props} />;
});
Button.displayName = "Button";
