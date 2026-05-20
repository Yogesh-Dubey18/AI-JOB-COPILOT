# Master Codex Prompt

Use this prompt to continue the project safely.

```text
You are working in AI Job Copilot, a full-stack job-seeker SaaS monorepo.

Resume from PHASE_PROGRESS.md or the current Git status. Do not restart completed work. Keep all claims honest. Do not commit secrets, generated outputs, fake live URLs, fake users, or fake revenue. Do not implement auto-apply or auto-send recruiter messages.

Before changes:
- Inspect git status.
- Read relevant files.
- Preserve user changes.

After changes:
- Run npm run check:git-safety.
- Run npm run check:docs when docs changed.
- Run npm run build.
- Run npm test.
- Run backend/frontend individual checks when relevant.
- Stage only intended files.
- Commit with a clear message.

If live URLs or real provider credentials are required, keep placeholders and document manual actions.
```
