# Public Portfolio v2

Phase 39 upgrades the portfolio generator into a publishable public profile system with privacy controls. It remains a demo/provider-ready feature until live hosting, object storage, and legal review are configured.

## Backend Model

New model:

- `PublicProfile`

Key fields:

- `userId`
- `portfolioId`
- `slug`
- `displayName`
- `headline`
- `hero`
- `about`
- `bio`
- `skills`
- `projects`
- `resumeUrl`
- `contactEmail`
- `links`
- `theme`
- `visibility`
- `sections`
- `isPublished`

The existing `Portfolio` model now also stores theme and section privacy settings so private generated content and public profile projection can stay aligned.

## API Routes

Private routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/portfolios` | List signed-in user's generated portfolios. |
| `POST` | `/api/portfolios/generate` | Generate a portfolio and sync a public profile projection. |
| `GET` | `/api/portfolios/:id` | Read a user-owned portfolio. |
| `PATCH` | `/api/portfolios/:id` | Update content, slug, theme, and privacy sections. |
| `POST` | `/api/portfolios/:id/publish` | Publish or unpublish the public profile. |

Public route:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/portfolios/public/:slug` | Return only published, privacy-filtered public profile data. |

## Frontend Routes

- `/portfolio-generator`: authenticated builder, publisher, theme selector, privacy controls, public link copy, and JSON export preview.
- `/u/[slug]`: public portfolio profile page.

## Themes

Initial themes:

- `classic`: default recruiter-friendly profile.
- `compact`: denser profile layout.
- `bold`: high-contrast presentation style.

These are intentionally simple so the public route stays stable and accessible.

## Privacy Controls

Section flags:

- `showEmail`
- `showResume`
- `showProjects`
- `showSkills`
- `showLinks`

Default behavior:

- Email is hidden.
- Resume URL is hidden.
- Projects, skills, and links can be shown.
- Public profile must be explicitly published.

## Data Flow

1. User opens `/portfolio-generator`.
2. User enters profile/project context and privacy preferences.
3. Backend calls the AI portfolio generator with mock/provider fallback.
4. Backend creates a private `Portfolio`.
5. Backend creates or updates a `PublicProfile` projection.
6. Public route returns only published and allowed fields.
7. `/u/[slug]` renders the public profile.

## Safety Notes

- Do not publish contact email or resume URL by default.
- Do not invent project experience.
- Keep public profile publication opt-in.
- Do not include secrets, private notes, rejection details, or application tracker data.
- Review generated content before sharing externally.

## Future Improvements

- Add portfolio screenshot upload and object-storage deletion.
- Add custom domains.
- Add project case study editor.
- Add accessibility checker for public profiles.
- Add analytics for public profile visits without exposing private user data.
