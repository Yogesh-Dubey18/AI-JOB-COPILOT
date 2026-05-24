# Maintenance Runbook

This guide covers coding standards, bug triage workflows, documentation update rules, and maintenance guidelines for developers supporting **AI Job Copilot**.

---

## 🛠️ Developer Code Guidelines

1. **No Direct Secret Commits:**
   - Never commit credentials to version control.
   - Always run `npm run check:git-safety` before staging files.
2. **Preserve Fallbacks:**
   - When modifying routes or AI modules, do not delete the structured mock data fallback rules. The app must stay fully functional even when external API credentials are not configured.
3. **Keep Code Typed:**
   - All shared properties must be defined in `@ai-job-copilot/shared` and validated with Zod schemas.

---

## 📥 Bug Triaging Workflow
When a bug is reported:
1. **Log Card:** Add a row to the [Triage Board](beta-feedback-triage-board.md).
2. **Replicate Locally:** Create a unit test or use local mock inputs to reproduce the failure.
3. **Commit & Verify:** Apply the fix and run:
   ```bash
   npm run check:git-safety
   npm run check:security
   npm run check:docs
   npm run build
   npm test
   ```
4. **Patch & Close:** Merge and deploy to production, then notify the tester using the templates in the [Support Playbook](support-and-feedback-playbook.md).

---

## 📝 Documentation Maintenance

1. **Strict Link Integrity:**
   - Do not commit dead document links.
   - Run `npm run check:docs` to check all Markdown link mappings across the 360+ files.
2. **Relative Links:**
   - All links to other repository documents must be relative. Absolute links (e.g. `file:///` or Windows path drives) break on other systems and fail the document check script.
3. **No Overclaiming:**
   - Do not list features as live or integrated unless tested access is verified. Keep labels like "provider-ready" or "mock-only" honest.

---

## 🚫 What Not to Do
1. **Do not scrape restricted sites:** Keep job feeds restricted to official API partners, RSS feeds, or manual file uploads.
2. **Do not store PII raw:** Always check the anonymize toggle is respected before passing data to AI models.
3. **Do not bypass local builds:** Never push code changes straight to production branch without compiling locally.
