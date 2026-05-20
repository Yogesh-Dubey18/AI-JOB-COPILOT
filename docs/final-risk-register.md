# Final Risk Register

| Risk | Level | Mitigation |
| --- | --- | --- |
| Real credentials committed | Critical | Git safety, `.gitignore`, manual review |
| Fake live URL claims | High | Use placeholders until verified |
| AI hallucinated advice | High | Structured fallback, user review, disclaimers |
| Auto-apply misuse | High | Do not implement auto-apply |
| Resume overclaiming | High | User-reviewed content and honest templates |
| Provider outage | Medium | Mock fallback and provider abstraction |
| Weak E2E coverage | Medium | Add Playwright in v2 |
| Legal/commercial gaps | Medium | Professional review before charging |
| Job scam exposure | Medium | Scam detector and safety checklist |
| Documentation drift | Low | `check:docs` and release review |
