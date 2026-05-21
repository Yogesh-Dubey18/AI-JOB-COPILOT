# v2 Beta Readiness Checklist

Use this checklist to decide whether AI Job Copilot is ready for a controlled public demo or beta review.

## Ready For Beta Demo

- Local build passes.
- Backend API tests pass.
- Frontend page tests pass.
- Extension build and parser tests pass.
- Git safety check passes.
- Security safety check passes.
- Documentation link check passes.
- PWA manifest and offline route build successfully.
- PDF export creates local ignored files and stores export history.
- Browser extension remains manual-save only.
- AI provider fallback works without external API keys.

## Not Yet Production-Complete

- Live frontend and backend URLs are not verified unless manually provided.
- MongoDB Atlas must be configured for deployed persistence.
- Real AI, email, billing, calendar, and monitoring providers require env keys.
- Playwright is not installed, so E2E is skip-safe rather than active.
- Chrome extension is unpacked/developer-mode only.
- Legal/business templates require professional review.

## Beta Acceptance Criteria

- A reviewer can register, log in, upload a resume, analyze it, browse jobs, tailor a resume, generate an application kit, track an application, prepare for interviews, view analytics, export PDFs, and inspect docs locally.
- The app does not auto-apply or auto-send messages.
- Mock/provider-ready areas are labelled honestly.
- No generated artifacts, secrets, build output, coverage, or extension dist files are tracked.

## Go/No-Go

Go for beta demo when all local verification commands pass and the manual demo can be completed end to end.

No-go if any secret is tracked, any build fails, auth is broken, generated outputs are staged, or docs overclaim live production readiness.
