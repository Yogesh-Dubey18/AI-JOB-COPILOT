# LinkedIn Post

I built AI Job Copilot, a full-stack AI-powered job-search SaaS for job seekers.

The idea is simple: upload your resume once, then use AI-assisted workflows to analyze ATS fit, discover matching jobs, tailor resumes, generate reviewable application messages, track applications, prepare for interviews, and improve after rejections.

What I built:

- Next.js App Router frontend with TypeScript and Tailwind
- Express.js TypeScript backend
- MongoDB/Mongoose-ready data model
- JWT auth with refresh token architecture
- Resume upload and parser fallback
- AI resume analysis, job matching, resume tailoring, application kit, interview prep, and mentor chat
- Application tracker, analytics, notifications, admin, settings, and SaaS plan foundations
- Mock fallback for AI/billing/email so the project runs locally without paid keys
- Deployment docs for Vercel, backend hosting, and MongoDB Atlas

I was careful not to make it an auto-apply tool. The app keeps job applications and recruiter messages user-reviewed.

This project helped me practice full-stack product thinking: architecture, security, UI/UX, testing, deployment docs, and honest production limitations.
