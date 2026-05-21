# Portfolio Privacy Guide

This guide explains how to share AI Job Copilot public profiles safely. It is not legal advice.

## Default Safe Settings

Recommended defaults:

- `showEmail`: off
- `showResume`: off
- `showProjects`: on
- `showSkills`: on
- `showLinks`: on, only if links are public and professional
- `isPublished`: off until the user reviews the page

## What Can Be Public

Usually safe:

- First name or professional display name.
- Headline.
- Public skills.
- Public project summaries.
- GitHub, LinkedIn, or portfolio links the user already wants recruiters to see.

Review carefully:

- Full name.
- Contact email.
- Resume URL.
- Phone number.
- Location.
- College details.
- Salary expectations.

Do not publish:

- Passwords, API keys, tokens, or secrets.
- Private application notes.
- Rejection reasons.
- Interview notes from specific companies.
- Hidden job-search analytics.
- Any experience, role, employer, or skill the user does not truthfully claim.

## Resume Link Handling

Resume URLs are hidden by default. Before enabling `showResume`:

- Confirm the resume file is meant to be public.
- Remove phone/address if the user does not want them public.
- Avoid generated PDF links that expire or point to local disk.
- Confirm object storage deletion is documented for production.

## Contact Email Handling

Contact email is hidden by default. Before enabling `showEmail`:

- Prefer a professional job-search email.
- Avoid personal or college emails if privacy matters.
- Do not show email if the user expects high spam risk.

## Public Slugs

Good slugs:

- `yogesh-full-stack`
- `react-node-developer`
- `mern-developer-portfolio`

Avoid slugs containing:

- Phone numbers.
- Birth dates.
- Private IDs.
- College roll numbers.

## Publication Checklist

- Review generated hero and about text.
- Confirm all listed skills are truthful.
- Confirm all projects are real and explainable.
- Open `/u/[slug]` on mobile and desktop.
- Confirm email/resume settings.
- Confirm the page does not include private application data.
- Keep a private backup/export of the generated JSON if needed.

## Production Notes

Public profile publishing should be monitored for abuse and privacy reports. If users are allowed to upload screenshots, resumes, or avatars later, add object storage scanning, deletion workflows, and content moderation rules.
