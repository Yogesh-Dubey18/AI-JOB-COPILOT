# Auth Session Persistence & Cross-Domain Cookie Architecture (Known Tech Debt)

This document outlines the current authentication session persistence strategy, the limitations imposed by cross-domain deployments, and the long-term technical solution.

## Current Strategy

To store authentication state securely and support persistence across page reloads without introducing XSS vulnerabilities (e.g., storing raw JWT tokens in `localStorage`), the system utilizes a combination of:
1. **Client-side State (`sessionStorage`)**: Holds the active JWT access token in memory/session-level storage (`ajc_access_token`) for the duration of the browser session. This protects the token from being permanently persisted on the disk or accessed after the browser is closed.
2. **UX Session Indicator Cookie (`ajc_session`)**: A client-writable, non-`httpOnly` cookie set by client JS upon successful login. It serves strictly as a **UX indicator** for the Next.js middleware to prevent page flicker/false redirects. The middleware performs a presence-only check (`req.cookies.has("ajc_session")`). This is **not a security guard**. True authorization is enforced by the backend on every API request using the actual JWT access token sent in the `Authorization` header. If a user manually sets `ajc_session` without a valid token, the backend API requests will fail with `401 Unauthorized`, and the client-side API layer will immediately clear the session state and redirect to `/login`.

---

## Technical Debt: Cross-Domain Cookie Limitation

### Why `httpOnly` Cookies Are Not Currently Feasible

In a standard production deployment of a split-frontend/backend SaaS (e.g., frontend on **Vercel** like `ai-job-copilot-frontend.vercel.app` and backend on **Render** like `ai-job-copilot-backend.onrender.com`), requests between the frontend and backend are considered **cross-site**. 

Browsers enforce strict restrictions on cross-site cookies:
- **Safari ITP (Intelligent Tracking Prevention)** blocks all third-party (cross-site) cookies by default.
- **Chrome Privacy Sandbox & Third-Party Cookie Deprecation** restricts and will block third-party cookies unless they use Partitioned storage (CHIPS) or are same-site.
- Setting cookies with `SameSite=None; Secure` is blocked in many environments unless the domains share a common parent registrable domain.

As a result, storing the JWT access or refresh token inside a secure, `httpOnly` cookie set by the backend server will fail to be sent or read reliably by the client browser during cross-origin API calls.

---

## Future Long-Term Remediation

To allow secure, `httpOnly` cookies to work reliably, we must migrate from a cross-origin setup to a same-origin or same-site setup. There are two standard architectures to achieve this:

### Option A: Next.js API Proxy / Rewrite (Recommended)
By proxying or rewriting api calls through Next.js, the browser communicates solely with the frontend origin.

In `next.config.js`:
```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_API_URL + '/api/:path*', // e.g. https://backend.onrender.com/api/:path*
      },
    ]
  },
}
```

**Benefits**:
1. All requests from the client's browser go to `/api/*` on the frontend host (e.g., `ai-job-copilot-frontend.vercel.app/api/*`), making them strictly **same-origin**.
2. Cookies can be set as `httpOnly; Secure; SameSite=Lax` by the backend through the proxy, and the browser will automatically include them in all API calls.
3. Completely avoids cross-site cookie restrictions (ITP, Chrome policies).

### Option B: Unified Domain with Subdomains
Move both the frontend and backend under the same registrable domain:
- Frontend: `app.yourdomain.com`
- Backend: `api.yourdomain.com`

**Benefits**:
1. Requests between `app.yourdomain.com` and `api.yourdomain.com` are **same-site** (they share the registrable domain `yourdomain.com`).
2. Cookies can be set with `Domain=.yourdomain.com; SameSite=Lax; Secure; HttpOnly`, allowing them to be shared securely across subdomains.

---

## Status
This architecture is *not* implemented in the current phase and is documented here as known tech debt to guide deployment topology in a future phase.
