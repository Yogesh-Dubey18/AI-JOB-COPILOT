# Localization Readiness

**Status:** Foundation implemented (v2 beta)  
**Languages planned:** English (en), Hindi (hi), Hinglish (hi-en)  

---

## What is Implemented

### Translation Dictionary (`frontend/lib/i18n.ts`)
- 50+ translation keys covering:
  - Navigation labels
  - Hero / landing page text
  - Auth labels (login, register, email, password)
  - Dashboard labels
  - Resume analyzer labels
  - Jobs page labels
  - Application kit labels
  - Tracker stage labels
  - Provider status labels (live, provider-ready, not configured)
  - Key AI disclaimers (review before applying, no auto-apply, privacy)
- `t(key, lang)` helper function — returns translated string, falls back to English
- `getStoredLanguage()` — reads from localStorage, fallback to 'en'
- `setStoredLanguage(lang)` — saves to localStorage

### Language Selector (`frontend/components/shared/language-selector.tsx`)
- Dropdown component with English, Hindi, Hinglish options
- Saves preference to localStorage as `ajc_lang`
- Dispatches `ajc:langchange` custom event for components to react
- Accessible: `role="listbox"`, `aria-selected`, `aria-label`

### Supported Languages

| Code | Name | Native Name | Status |
|------|------|-------------|--------|
| en | English | English | ✅ Complete |
| hi | Hindi | हिंदी | ✅ Foundation (50+ keys) |
| hinglish | Hinglish | Hinglish | ✅ Foundation (50+ keys) |

---

## What Remains English

All page body content, blog posts, resource cards, templates, help text, and docs are English only. Full translation of all page content is future work.

---

## How to Add a New String

1. Open `frontend/lib/i18n.ts`
2. Add the key to the `Translations` interface (TypeScript enforces all languages get the key)
3. Add values for `en`, `hi`, and `hinglish`
4. Use `t("your.key", lang)` in any component

```typescript
// Example
"jobs.remote": string;
// ...
en: { "jobs.remote": "Remote" },
hi: { "jobs.remote": "रिमोट" },
hinglish: { "jobs.remote": "Remote" }
```

## How to Add a New Language

1. Add the language code to `SupportedLanguage` type in `i18n.ts`
2. Add it to `SUPPORTED_LANGUAGES` array
3. Create a full translation object implementing all `Translations` keys
4. Add it to `TRANSLATIONS`

## How to Use the Language Selector

```tsx
import { LanguageSelector } from "@/components/shared/language-selector";

// In any layout or navbar:
<LanguageSelector className="ml-auto" />
```

## Known Limitations

- The language selector changes localStorage preference but does NOT automatically re-render the full app — this requires a React Context or global state wrapping the app.
- Most page content is still English — only the key labels in the dictionary are translated.
- Server-side rendering uses the default language (English); client-side picks up localStorage preference.
- No URL-based locale routing (e.g., /hi/dashboard) — this requires Next.js i18n routing config, which is future work.
- No right-to-left (RTL) language support planned at v2 beta.
- Hindi translations are machine-aided — review by a native speaker is recommended before publishing.

## Testing Checklist

- [ ] Language selector renders in the UI
- [ ] Selecting Hindi changes localStorage to 'hi'
- [ ] Selecting Hinglish changes localStorage to 'hinglish'
- [ ] `t("nav.dashboard", "hi")` returns "डैशबोर्ड"
- [ ] `t("disclaimer.noAutoApply", "en")` returns the English disclaimer
- [ ] Fallback to English works for any missing key
- [ ] Language selector is keyboard accessible (Tab / Enter)

## Future Improvements

1. Wrap app in a `LanguageContext` provider so all `t()` calls auto-use the current lang
2. Add URL-based locale routing via Next.js i18n config
3. Add a full Hindi/Hinglish translation of all page content
4. Add Malayalam and Tamil for South Indian market expansion
5. Add automated translation quality checks in CI
