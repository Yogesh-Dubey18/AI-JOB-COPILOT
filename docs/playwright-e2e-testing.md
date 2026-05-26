# Playwright E2E Testing Guide

This guide details the Playwright End-to-End (E2E) testing framework setup, test cases, configuration settings, mock intercept protocols, and verification instructions on **AI Job Copilot**.

---

## 🔍 E2E Architecture & Mock Intercept Strategy

To ensure high reliability, fast runs, and zero dependency on a live backend server or database state, all E2E tests are **hermetic**. They use Playwright's native `page.route()` network interception APIs to mock backend responses.

This prevents:
- Database cold-start delays.
- State conflicts between parallel test runs.
- Accidental leaks of production credentials or secrets.

---

## 🛠️ Folder & File Structure

E2E files are organized inside the `frontend` folder:
- **Test Specifications**: [frontend/e2e/smoke.spec.ts](../frontend/e2e/smoke.spec.ts)
- **Playwright Configuration**: [frontend/playwright.config.mjs](../frontend/playwright.config.mjs)
- **E2E Wrapper Script**: [frontend/scripts/run-e2e-if-installed.mjs](../frontend/scripts/run-e2e-if-installed.mjs)

---

## 📋 Approved E2E Test Coverage

The smoke test suite verifies 12 critical user flows:

1. **Public Routes Smoke Test**: Validates that public-facing marketing views (`/`, `/pricing`, `/about`, `/features`, `/feedback`, and `/blog`) render successfully.
2. **Login Page Load**: Verifies `/login` loads correctly and renders all required form controls (`Email`, `Password`, and the forgot-password action).
3. **Register Page Load**: Verifies `/register` loads correctly and displays registration inputs along with the password guidance criteria panel.
4. **Password Guidance Checklist**: Asserts that the register complexity guidelines card is present and visible.
5. **Forgot Password Safe Fallback Notice**: Mocks `/api/auth/providers/status` returning unconfigured email settings and checks that the page displays the safe `"Email service not active"` fallback note.
6. **Reset Password Page**: Verifies that the parameters rehydration works and shows the password requirements guide.
7. **Google OAuth Button State**: Mocks `/api/auth/providers/status` returning unconfigured Google OAuth state and verifies that the sign-in/register button with label `"Continue with Google — coming soon"` is disabled.
8. **Protected Routes Redirection**: Asserts that the following 7 authenticated routes perform a `302` client-side redirect back to `/login` when the session is missing:
   * `/dashboard`
   * `/resume/upload`
   * `/resume/analyzer`
   * `/jobs`
   * `/guided-workflow`
   * `/portfolio-generator`
   * `/settings/integrations`
9. **Integrations Settings Honest Badge Display**: Mocks a demo session rehydration (`ajc_session=1` cookie and `sessionStorage` token bypass) and mocks `/api/jobs/sources` to return live vs ready vs unconfigured providers, asserting that `Live`, `Provider-ready`, and `Not configured` badge styles render honestly.

---

## 🚀 How to Run Tests

### Prerequisite: Install Browser Binaries
If Playwright browsers are not yet installed on the host system:
```bash
npx playwright install chromium
```

### Local Test Execution
To run all tests headlessly in chromium and mobile projects:
```bash
npx playwright test
```

### Running with UI Mode
To run tests with the interactive Playwright UI explorer:
```bash
npx playwright test --ui
```

### Overall CI Verification
The E2E tests are integrated into the master CI verification script. You can run the entire codebase linting, link audits, compilation checks, and E2E suites via:
```bash
npm run ci:verify
```

---

## 🛡️ Security Rules & Best Practices

1. **Zero Production Variables**: Never configure real production passwords, API tokens, or cloud keys inside `.env` files used for E2E tests.
2. **No Real Document Uploads**: Do not upload actual user resumes or cover letters during automatic testing. Mock all parsing endpoints.
3. **Simulate Email & OAuth Flows**: Intercept the callback endpoints and mock status configurations rather than calling real Google servers or SendGrid endpoints.
4. **Clean up Session Storage**: Keep test runs completely isolated by resetting storage states between runs in Playwright hooks.
