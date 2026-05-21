# PWA Mobile v2

AI Job Copilot now has a safer PWA foundation for public demo and mobile use.

## Implemented

- Improved `manifest.json` with app id, scope, orientation, categories, maskable icon purpose, and shortcuts.
- Added a conservative service worker at `frontend/public/sw.js`.
- Added an install helper that appears only when the browser provides an install prompt.
- Improved `/offline` as a mobile-friendly fallback page.
- Improved mobile app shell spacing, safe-area padding, truncation, and sidebar scrolling.

## Offline Behavior

The service worker caches only:

- `/offline`
- `/manifest.json`
- app icon placeholders

For navigation requests, it tries the network first and falls back to `/offline` when offline.

It does not cache:

- API responses
- uploaded resumes
- generated PDFs
- private dashboard data
- AI responses
- application tracker records

This is intentional. User-specific career data should not be cached casually on shared or unmanaged devices.

## Install Support

The install helper registers the service worker on HTTPS or localhost and listens for the browser install prompt. It does not fake installability and does not show unless the browser considers the app installable.

## Production Checklist

- Confirm HTTPS is enabled.
- Confirm `NEXT_PUBLIC_API_URL` points to the deployed backend.
- Confirm manifest icons load.
- Confirm `/offline` works when network is disabled.
- Confirm private API data is not available offline.
- Confirm mobile bottom navigation does not overlap page actions.
- Test on Chrome Android, Edge desktop, and Safari iOS where possible.

## Future Upgrade Path

- Add PNG icons generated from the SVG placeholders.
- Add screenshot assets for richer install prompts.
- Add push notifications only after notification consent and backend delivery are production-ready.
- Add selective offline drafts for non-sensitive local notes with explicit user consent.
- Add Capacitor or Trusted Web Activity packaging only after the web app is stable.
