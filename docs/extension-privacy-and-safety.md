# Extension Privacy And Safety

The browser assistant must stay user-controlled and conservative.

## Hard Rules

- Do not auto-apply to jobs.
- Do not auto-send recruiter messages.
- Do not scrape protected sites or bypass access controls.
- Do not collect hidden page data.
- Do not store credentials in the extension.
- Do not hardcode production URLs or secrets.
- Do not save a job until the user reviews and clicks save.

## Data Access

The content script reads visible page text only after the popup sends a parse request. It extracts a draft with:

- title
- company
- location
- apply URL
- visible description
- detected skills
- basic risk flags

The draft stays in the popup until the user saves it.

## Permissions

The extension uses:

- `activeTab` for the current browser tab.
- `storage` for local API/app URL settings.
- `scripting` for Manifest V3 compatibility.
- HTTP/HTTPS host permissions so the content script can respond on public job pages.

Before publishing, reduce host permissions if a narrower allowlist is chosen.

## User Review Workflow

1. User opens a job page.
2. User clicks "Parse visible job".
3. Extension fills editable fields.
4. User reviews title, company, location, URL, skills, and description.
5. User clicks "Save reviewed job".
6. Backend stores the job through manual import normalization.

## Message Safety

The copy-message helper only copies text to the clipboard. The user must review and paste manually. The extension does not open chat boxes, send emails, send LinkedIn messages, or interact with application forms.

## Production Review Checklist

- Privacy policy mentions browser assistant behavior.
- Store listing describes manual capture honestly.
- Host permissions are justified.
- API URL is configurable.
- Generated messages are labelled user-review content.
- No real secrets are bundled into `extension/dist`.
- Build output remains ignored by Git.
