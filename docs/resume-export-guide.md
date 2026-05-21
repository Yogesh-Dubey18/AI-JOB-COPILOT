# Resume Export Guide

Use this guide when exporting resumes and career assets from AI Job Copilot.

## Resume Export Workflow

1. Upload or generate a resume.
2. Review the parsed content and ATS score.
3. Tailor the resume only with truthful skills, projects, and experience.
4. Generate a PDF export from the Exports page or the resume export API.
5. Open the PDF and review formatting before sharing.
6. Rename the downloaded file manually for the target role or company.

## Export Types

Resume:
Use a base resume ID or resume version ID with `POST /api/exports/resume/:id`.

Tailored resume:
Use the tailored resume ID with `POST /api/exports/tailored-resume/:id`.

Application kit:
Use the application kit ID with `POST /api/exports/application-kit/:id`.

Portfolio:
Use the portfolio ID with `POST /api/exports/portfolio/:id`.

Interview prep:
Use the interview ID with `POST /api/exports/interview-prep/:id`.

## Quality Checklist

- Contact details are correct.
- Skills are true and can be explained.
- Project bullets match actual work.
- No fake experience is added.
- Portfolio contact and resume visibility settings are intentional.
- The PDF opens correctly before sharing.
- The official job application remains manual and user-reviewed.

## Production Upgrade Path

The v2 renderer creates reliable basic PDFs locally. For commercial polish, upgrade the renderer behind `pdf-export.service.ts`:

- Add a branded resume template.
- Add page headers and footers.
- Add ATS-friendly one-page constraints.
- Add export preview before saving.
- Store generated files in object storage.
- Add scheduled cleanup for old generated files.
- Add signed download URLs.

## Honesty Rules

AI Job Copilot must never add fabricated experience, education, certifications, job titles, employers, or projects. Exports are packaging for reviewed user data, not a way to invent credentials.
