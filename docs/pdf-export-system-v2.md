# PDF Export System v2

AI Job Copilot now has a production-safe PDF export foundation for user-owned career artifacts.

## What Exports Support

- Base resumes and saved resume versions.
- Tailored resumes created for specific jobs.
- Application kits with cover letter, recruiter messages, salary answers, and interview prep plan.
- Portfolio exports with section privacy settings applied.
- Interview prep exports for saved interview rounds.

## Backend Architecture

- Model: `PdfExport`
- Service: `backend/src/services/pdf-export.service.ts`
- Routes: `backend/src/routes/export.routes.ts`
- Static file serving: `/uploads/exports/:fileName`
- History endpoint: `GET /api/exports/history`

The current renderer is `native-basic-pdf`. It generates a valid minimal PDF without adding a heavy rendering dependency. This keeps local development, tests, and deployment builds reliable. A future upgrade can swap the renderer behind the same service boundary for Playwright, React PDF, or a hosted document renderer.

## API Routes

- `POST /api/exports/resume/:id`
- `POST /api/exports/tailored-resume/:id`
- `POST /api/exports/application-kit/:id`
- `POST /api/exports/portfolio/:id`
- `POST /api/exports/interview-prep/:id`
- `GET /api/exports/history`
- `GET /api/exports/:id`
- Legacy compatibility: `POST /api/resumes/:id/export-pdf`

All export routes require authentication and verify the source record belongs to the current user.

## Storage Behavior

Generated PDFs are written to local ignored upload storage:

```text
backend/uploads/exports/
```

The generated files are not committed. The `.gitignore` keeps uploads, generated exports, and PDFs out of version control.

For production, connect one of these storage targets:

- Cloudinary raw file uploads.
- S3-compatible object storage.
- Render/Railway persistent disk if available.
- A private document storage bucket with signed URLs.

## Privacy Controls

- Export history is user-scoped.
- Source ownership is verified before generating a file.
- Portfolio exports respect `sections.showEmail`, `sections.showResume`, `sections.showProjects`, and `sections.showSkills`.
- Generated files are local artifacts; external object deletion and retention must be handled by the deployment runbook once object storage is connected.

## Operational Notes

- The PDF renderer is intentionally simple and deterministic.
- Export history stores file metadata, renderer name, source type, source id, and privacy notes.
- Generated files should be cleaned by retention jobs in production.
- Do not email or publish exports automatically; the user must review and share manually.
