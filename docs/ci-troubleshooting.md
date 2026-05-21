# CI Troubleshooting

Use this guide when GitHub Actions fails.

## Install Fails

- Confirm `package-lock.json` is committed.
- Confirm the workflow uses `npm ci`, not a different package manager.
- Confirm no workspace package was added without updating the root lockfile.

## Build Fails

- Reproduce locally with `npm run build`.
- If frontend fails, run `npm run build --prefix frontend`.
- If backend fails, run `npm run build --prefix backend`.
- Check whether a provider-only feature accidentally requires real env values during build.

## Tests Fail

- Reproduce with `npm test`.
- Backend tests should use mock/in-memory behavior and must not require MongoDB Atlas.
- Frontend tests should not require the backend to be running.
- Recharts zero-size warnings in jsdom are known non-fatal warnings if tests pass.

## E2E Is Skipped

The current E2E command is skip-safe:

~~~bash
npm run test:e2e --prefix frontend
~~~

If `@playwright/test` is not installed, the command exits successfully and prints a skip message. Install Playwright only after approving the dependency and browser binary download path.

## Security Workflow Reports Audit Issues

The audit step is advisory. Do not run `npm audit fix --force` without review. For each high severity advisory:

- Confirm whether the vulnerable path is actually used.
- Prefer a targeted dependency upgrade.
- Run build and tests after upgrades.
- Document residual risk if no safe patch exists.

## Git Safety Fails

- Remove staged/generated outputs from git tracking.
- Keep only `.env.example` files tracked.
- Never delete local real `.env` files to fix git safety; untrack or ignore them instead.
