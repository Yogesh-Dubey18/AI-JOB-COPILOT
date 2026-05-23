"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, SupportedLanguage, getStoredLanguage, setStoredLanguage } from "@/lib/i18n";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const [lang, setLang] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLang(getStoredLanguage());
  }, []);

  function select(code: SupportedLanguage) {
    setLang(code);
    setStoredLanguage(code);
    setOpen(false);
    // Dispatch custom event so other components can listen for language changes
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ajc:langchange", { detail: { lang: code } }));
    }
  }

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Languages className="h-3.5 w-3.5" aria-hidden="true" />
        {current.nativeLabel}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language options"
          className="absolute right-0 z-50 mt-1 min-w-[140px] overflow-hidden rounded-md border bg-card shadow-lg"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                onClick={() => select(l.code)}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-muted ${l.code === lang ? "bg-primary/10 font-semibold" : ""}`}
              >
                {l.nativeLabel} <span className="text-muted-foreground">({l.label})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
