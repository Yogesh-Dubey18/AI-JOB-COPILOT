"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <Button aria-label="Toggle theme" title="Toggle theme" variant="ghost" className="w-10 px-0" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
