# Performance, Accessibility, and UX v2

AI Job Copilot v2 treats polish as product reliability: the user should know what is loading, what failed, what is empty, and what action is safe to take next.

## Frontend Performance

- Keep workflow pages mobile-first and avoid heavy client-only islands unless interaction requires them.
- Use TanStack Query retry control for feature screens so failed provider calls do not spin forever.
- Keep AI results and job/application lists in bounded containers to avoid large layout shifts.
- Prefer reusable loading, empty, and error states over ad hoc text blocks.
- Keep form controls labelled with accessible names so browser autofill, screen readers, and tests behave predictably.
- Avoid expensive charts or large data tables above the fold on mobile.

## Backend API Performance

- API responses are rate limited globally and more tightly for AI endpoints.
- Sensitive API responses use `Cache-Control: no-store`; job discovery GET responses may use short private caching.
- Health responses are small, secret-free, and include uptime/timestamp for deployment checks.
- Pagination and server-side filtering remain the preferred path for jobs, applications, notifications, and admin datasets.
- AI calls must keep timeout, retry, schema validation, usage tracking, and mock fallback behavior.

## Accessibility Pass

- Primary app navigation now exposes desktop and mobile navigation landmarks.
- Core workflow controls include accessible labels and keyboard focus styling.
- Loading states use `role="status"` with polite updates.
- Error states use `role="alert"` so failures are announced.
- Icon-only actions include `aria-label` text.
- Forms should keep required fields explicit and avoid hidden validation surprises.

## UX State Pattern

Use `frontend/components/shared/status-state.tsx` for common states:

- `LoadingState`: data fetches, uploads, parsing, and AI generation.
- `EmptyState`: no jobs, no applications, no parsed resume, or no generated result yet.
- `ErrorState`: failed API, upload, AI, or mutation responses.
- `RetryButton`: local retry action that calls query refetch or mutation retry.

## Workflow Polish Scope

- Dashboard: daily matches now show loading and empty guidance.
- Resume upload: file type/size validation, upload errors, parsing state, and parsed preview empty state.
- Jobs: labelled filters, loading/error/empty states, and live result count.
- Applications: accessible manual form, pipeline loading/error/empty states, and empty stage placeholders.
- Navigation: mobile bottom navigation for the most-used protected pages.

## Remaining Improvements

- Run real Playwright browser checks after installing `@playwright/test`.
- Add route-aware active nav styling once navigation state is moved to a client shell.
- Add automated axe accessibility checks in CI if the dependency is approved.
- Add skeletons only where they provide useful visual continuity and do not hide important status text.
