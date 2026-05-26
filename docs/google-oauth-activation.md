# Google OAuth Activation Guide

This guide details the requirements, configuration steps, URLs, and safety checklists to activate live Google Sign-in on **AI Job Copilot**.

---

## 🛠️ Google Cloud Console Setup Steps

1. **Create/Select Project:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing one (e.g. `AI Job Copilot`).

2. **Configure OAuth Consent Screen:**
   - Navigate to **APIs & Services** > **OAuth consent screen**.
   - Select **External** User Type and click **Create**.
   - Fill in app metadata:
     - **App name:** AI Job Copilot
     - **User support email:** your-email@example.com
     - **Developer contact information:** your-email@example.com
   - Set scopes:
     - Add `.../auth/userinfo.email`
     - Add `.../auth/userinfo.profile`
     - Add `openid`
   - Add test users (under Test users tab) to allow logging in during beta status.

3. **Create Credentials:**
   - Navigate to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - Select **Web application** as application type.
   - **Name:** AI Job Copilot Client
   - **Authorized JavaScript Origins:**
     - Local development: `http://localhost:3000`
     - Production: `https://ai-job-copilot-frontend.vercel.app`
   - **Authorized redirect URIs:**
     - Local development: `http://localhost:5000/api/auth/google/callback`
     - Production: `https://ai-job-copilot-backend-l6ut.onrender.com/api/auth/google/callback`
   - Click **Create** to obtain `Client ID` and `Client Secret`.

---

## 🔑 Environment Variables Setup

Configure the following variables in the production environment settings dashboard (e.g., Render/Vercel environment variables) or the local backend/frontend `.env` files:

### Backend Variables (`backend/.env`):
```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
GOOGLE_REDIRECT_URI=https://ai-job-copilot-backend-l6ut.onrender.com/api/auth/google/callback
CLIENT_URL=https://ai-job-copilot-frontend.vercel.app
```
*(For local development, set `GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback` and `CLIENT_URL=http://localhost:3000`)*

### Frontend Variables (`frontend/.env`):
```env
NEXT_PUBLIC_API_URL=https://ai-job-copilot-backend-l6ut.onrender.com/api
```

---

## 📋 Integration Test Checklist

- [ ] **Provider-ready state:** With env variables unset, verify that the login/register forms display the disabled button `"Continue with Google — coming soon"`.
- [ ] **Dynamic Live state:** Set mock credentials in local env. Verify that the login form automatically enables the `"Continue with Google"` button.
- [ ] **Consent Redirect:** Click the enabled button and verify redirection to the Google OAuth consent page.
- [ ] **Callback Handshake:** Sign in through the Google popup. Verify that Google redirects to the backend callback endpoint `/api/auth/google/callback?code=...`.
- [ ] **JWT Handshake & Rehydration:** Verify that the backend redirects back to the frontend with the `googleToken` parameter (`/login?googleToken=...`), which the client-side form parses and stores in `sessionStorage` before navigating to the `/dashboard`.
- [ ] **Auth persistence check:** Ensure navigating to `/jobs` or refreshing does not trigger a login popup after Google authentication.

---

## 🛡️ Rollback Protocol

If Google OAuth login breaks (e.g. invalid client secret or consent screen validation block):
1. Remove `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables from the Render backend configuration dashboard.
2. Restart the Render server.
3. The platform will automatically revert back to the secure **Provider-ready** mode: the Google button becomes disabled and users will be guided to use email/password authentication instead.

---

## ⚠️ Common OAuth Errors

| Error Code | Common Cause | Resolution |
| :--- | :--- | :--- |
| `redirect_uri_mismatch` | The backend callback URL doesn't match Google Console redirect URI. | Ensure `GOOGLE_REDIRECT_URI` is exactly identical to the Redirect URI registered in the Google Cloud Console (including port and protocol). |
| `invalid_client` | Missing or incorrect client ID/secret. | Verify credentials in GCP console match backend env variables exactly. Check for trailing spaces. |
| `access_denied` | The user declined the OAuth consent. | The backend redirects safely back to `/login?error=Google authentication failed` to notify the user. |

---

## 🔒 Security Notes: URL Token Exposure Risk & Handoff

> [!WARNING]
> **P0 Follow-up Action Required: HttpOnly Cookie Session Handoff**
>
> * **Current Risk:** The client redirects from the Google callback URL back to `/login?googleToken=...`. Exposing JWTs in URL parameters is vulnerable to local storage caching, proxy logs, and `Referer` headers.
> * **Mitigation in Phase C:** The JWT is short-lived (expires in 15 minutes) to minimize token lifetime exposure.
> * **Recommended Architecture:** Transition session rehydration to a secure, HttpOnly, SameSite cookie handshake. Since the backend `/api/auth/google/callback` already issues secure cookies, the client should query `/api/auth/me` on redirect to verify/initialize the session, eliminating the need to expose any tokens in the URL.
