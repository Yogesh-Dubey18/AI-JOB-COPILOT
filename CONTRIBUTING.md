# Contributing

AI Job Copilot is a job-seeker focused SaaS project. Contributions should improve the candidate workflow without enabling spam, fake experience, unsafe scraping, or auto-application behavior.

## Local Setup

```bash
npm install
npm run install:all
npm run dev
```

## Before Opening A Pull Request

```bash
npm run check:git-safety
npm run check:docs
npm run build
npm test
```

Also run targeted backend/frontend commands when touching those areas.

## Standards

- Keep TypeScript strict and readable.
- Do not commit real secrets or local `.env` files.
- Keep `.env.example` placeholder-only.
- Do not add fake users, revenue, partnerships, or live URLs.
- Do not add auto-apply or auto-send workflows.
- Use mock/provider-ready architecture when credentials are unavailable.
- Update docs when behavior changes.

## Branch And Commit Style

- Use concise branch names, ideally `codex/<topic>` or `feature/<topic>`.
- Use clear commit messages that describe the actual change.
- Keep unrelated changes out of the same commit.
