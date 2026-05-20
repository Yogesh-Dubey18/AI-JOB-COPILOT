# Resume Intelligence v2

Phase 26 upgrades the resume intelligence foundation without adding unsafe parser dependencies.

## What Changed

- Added deterministic ATS scoring service with role keyword banks for React, MERN, Node, Frontend, and Full Stack roles.
- Added ATS breakdown factors: contact information, skills match, experience/project quality, keywords, formatting, and action verbs.
- Added keyword coverage details with detected and missing role keywords.
- Improved parser metadata with parser quality, parser warnings, detected sections, and word count.
- Kept TXT parsing as highest-accuracy local mode.
- Kept PDF/DOCX extraction as safe fallback until dedicated parser packages are intentionally added.
- Improved frontend resume analyzer UI to show keyword coverage, ATS factor breakdown, and parser warnings.
- Added backend/frontend tests for the upgraded resume analysis flow.

## Role Keyword Banks

- React: React, TypeScript, JavaScript, Hooks, Redux, Tailwind, Responsive UI, REST API, Testing, Git.
- MERN: MongoDB, Express, React, Node.js, REST API, JWT, Authentication, Mongoose, TypeScript, Deployment.
- Node: Node.js, Express, REST API, MongoDB, Mongoose, JWT, Authentication, Validation, Testing, Deployment.
- Frontend: HTML, CSS, JavaScript, TypeScript, React, Responsive UI, Accessibility, Tailwind, API integration, Testing.
- Full Stack: React, Node.js, Express, MongoDB, TypeScript, REST API, Authentication, Testing, Deployment, Git.

## Honest Limitations

- PDF and DOCX parsing remain fallback-only because no dedicated parser package is currently installed.
- ATS scoring is a deterministic local heuristic plus AI fallback output, not a guarantee of recruiter screening results.
- Users should not add skills or experience they cannot defend in interviews.

## Future Upgrade

- Add approved PDF/DOCX parser packages after dependency review.
- Add resume section boundary extraction.
- Add role-specific scoring calibration from real feedback.
- Add resume diff view between base and improved versions.
- Add exportable ATS report PDF.

