# AI Job Copilot Browser Extension — Safe Workflow Guide

> **Compliance rule**: This extension is designed for manual job capture only. No auto-fill, no auto-submit, no anti-detection, no bot evasion, no residential proxy, no WebDriver suppression.

---

## What the Extension Does (Allowed)

- Capture job title, company, and URL from the current browser tab (via browser action button click)
- Let the user review and confirm the capture before saving
- Save the captured job to the AI Job Copilot tracker (manual initiation only)
- Display form fields for the user to copy-paste into job application forms
- Remind the user to review all AI-generated content before sending

## What the Extension Does NOT Do (Blocked)

- Auto-fill application form fields without user action
- Submit application forms automatically
- Track or read browsing history without explicit permission
- Use anti-detection headers, fingerprint spoofing, or bot evasion
- Bypass CAPTCHA or rate limits
- Store credentials or session cookies for external sites
- Use residential proxies or IP rotation
- Scrape LinkedIn, Indeed, Naukri, Glassdoor, ZipRecruiter, or any site that prohibits scraping
- Run background tab monitoring without user knowledge

---

## Architecture Overview

```
User clicks extension icon
      |
      v
Extension reads visible tab URL + title (with user permission)
      |
      v
Display capture form to user (user reviews and edits)
      |
      v
User clicks "Save to Tracker" (explicit action required)
      |
      v
Extension sends job data to AI Job Copilot API (authenticated)
      |
      v
Job appears in tracker as "Saved" for user to process manually
```

---

## Current Status

| Feature | Status |
|---|---|
| Manual job URL capture | Implemented (Chrome extension foundation) |
| User-initiated save to tracker | Implemented |
| Auto-fill form fields | NOT IMPLEMENTED (blocked) |
| Auto-submit applications | NOT IMPLEMENTED (blocked) |
| Background page monitoring | NOT IMPLEMENTED (blocked) |
| Scraping protected pages | NOT IMPLEMENTED (blocked) |
| Chrome Web Store packaging | Planned (pending TOS review) |

---

## Setup Instructions

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle top right)
3. Click **Load unpacked** and select the `extension/` folder from the project root
4. The AI Job Copilot icon will appear in the toolbar
5. Navigate to a job listing page
6. Click the extension icon and review the pre-filled fields
7. Click **Save to Tracker** to add it to your application list

---

## Chrome Web Store Publishing (Planned)

- The extension requires a Chrome Web Store developer account ($5 one-time fee)
- The manifest must pass Google's privacy policy requirements
- No sensitive host permissions (beyond `activeTab`) will be requested
- Background scripts that run without user action will not be used

---

## Environment Variables for Extension Sync

The extension uses the same user session as the web app. No separate credentials are needed.

```env
# In frontend .env.local
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
```

---

*Internal compliance document. All blocked features are non-negotiable for safety, ethics, and TOS compliance.*
