# Chrome Extension v2

AI Job Copilot includes a Manifest V3 browser assistant foundation in `extension/`.

## Purpose

The extension helps a job seeker manually capture a visible job page, review the extracted fields, save the job into AI Job Copilot, copy a short interest message, and open the web app.

It is not an auto-apply tool and it does not submit applications.

## Structure

```text
extension/
  public/
    manifest.json
    popup.html
    options.html
    styles.css
  src/
    apiClient.ts
    contentScript.ts
    jobParser.ts
    messageTemplates.ts
    options.ts
    popup.ts
    storage.ts
    types.ts
  tests/
    jobParser.test.mjs
```

## Commands

```bash
npm run build --prefix extension
npm test --prefix extension
```

The build writes unpacked extension files to `extension/dist/`. That directory is ignored and must not be committed.

## Manual Local Testing

1. Run the backend and frontend locally.
2. Build the extension.
3. Open Chrome extension management.
4. Enable developer mode.
5. Load unpacked extension from `extension/dist`.
6. Open extension options.
7. Confirm API URL is `http://localhost:5000/api`.
8. Confirm app URL is `http://localhost:3000`.
9. Log in to AI Job Copilot in the same browser.
10. Open a public job page.
11. Click "Parse visible job".
12. Review and edit fields.
13. Click "Save reviewed job".

## Backend Integration

The extension saves reviewed jobs through:

```text
POST /api/jobs/manual-import
```

This reuses backend normalization, duplicate detection, risk flags, and trust scoring.

## Future Upgrade Path

- Add a background service worker for richer authenticated state checks.
- Add optional page-specific parsers for allowed public career pages.
- Add a saved-job confirmation deep link.
- Add extension-specific rate limiting and audit metadata.
- Add browser-store packaging assets after legal and privacy review.
