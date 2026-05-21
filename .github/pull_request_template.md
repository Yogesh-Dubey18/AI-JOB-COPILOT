# Pull Request

## Summary

- 

## Verification

- [ ] `npm run check:git-safety`
- [ ] `npm run check:security`
- [ ] `npm run check:docs`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run test:e2e --prefix frontend` if frontend flow changed

## Safety

- [ ] No real secrets or `.env` files committed.
- [ ] No generated artifacts committed.
- [ ] No fake live URLs, users, metrics, partnerships, or credentials added.
- [ ] No auto-apply or auto-send recruiter workflow added.
- [ ] AI, billing, email, calendar, and deployment provider changes are mock-safe unless real env keys are configured outside git.
- [ ] Documentation labels provider-ready or template-only work honestly.

## Product Impact

- [ ] Resume, job, application, interview, billing, admin, or public docs impact noted.
- [ ] Loading, empty, error, and mobile states checked for touched frontend screens.
- [ ] API changes include validation, user isolation, and safe error behavior.

## Notes

Add deployment, migration, or manual setup notes here.
