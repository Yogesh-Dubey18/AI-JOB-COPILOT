# Mobile UX Checklist

Use this checklist before demoing AI Job Copilot on mobile.

## Navigation

- Bottom navigation is visible and does not overlap primary content.
- Header title truncates cleanly on narrow screens.
- Profile and notification links remain tappable.
- Sidebar remains desktop-only.

## Forms

- Inputs use full width on small screens.
- Buttons do not wrap awkwardly.
- File upload controls remain reachable.
- Error messages are visible without horizontal scrolling.

## Lists And Tables

- Cards stack vertically on mobile.
- Long company names and job titles wrap or truncate safely.
- Kanban/table views remain scrollable.
- Export and download links remain tappable.

## PWA

- Manifest loads from `/manifest.json`.
- Offline route loads from `/offline`.
- Service worker falls back to the offline page for navigation failures.
- API data is not cached offline by default.
- Install prompt appears only when the browser provides it.

## Accessibility

- Touch targets are at least 40px high where practical.
- Focus rings are visible.
- Loading, empty, and error states use status or alert semantics.
- Text contrast remains readable in light and dark mode.

## Manual Device Checks

- Chrome Android.
- Safari iOS.
- Edge desktop install prompt.
- Narrow viewport around 360px width.
- Landscape orientation for key dashboards.
