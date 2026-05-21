# Final Next 7 Days Action Plan

This plan starts after Phase 50 and keeps work practical.

## Day 1: Local Verification And Repo Review

- Pull latest `main`.
- Run all verification commands from [START_HERE.md](../START_HERE.md).
- Review [Final Archive Checklist](final-archive-checklist.md).
- Create issues for any failing command instead of broad rewrites.

## Day 2: Backend Deployment Preparation

- Create MongoDB Atlas cluster.
- Create backend hosting service.
- Add backend environment variables in the hosting dashboard.
- Deploy backend.
- Verify `/health`.

## Day 3: Frontend Deployment Preparation

- Create Vercel project using `frontend` as root.
- Set `NEXT_PUBLIC_API_URL` to the backend `/api` URL.
- Deploy frontend.
- Verify auth, dashboard, resume, jobs, applications, and settings pages.

## Day 4: Live Smoke Test And Docs Update

- Run [Production Smoke Test](production-smoke-test.md).
- Update live URL docs only with verified URLs.
- Add any production-only failures as GitHub issues.

## Day 5: Portfolio And Recruiter Assets

- Update resume, LinkedIn, GitHub pinned repo, and portfolio content using the prepared docs.
- Record a short demo video if the live deployment is stable.
- Keep all claims honest and evidence-based.

## Day 6: First 100 Applications Setup

- Use the campaign trackers.
- Select target roles and job boards.
- Prepare role-specific resume versions.
- Begin manual applications only after reviewing each job.

## Day 7: Feedback Loop

- Share the demo with 3 to 5 trusted reviewers.
- Collect feedback through the in-app feedback form or tracker docs.
- Convert feedback into small issues.
- Pick one issue for the next sprint.
