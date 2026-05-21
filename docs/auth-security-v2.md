# Auth Security v2

Phase 33 strengthens the authentication and security foundation while keeping local development simple.

## Improvements

- Stronger password validation for registration and password reset.
- Temporary account lock after repeated failed login attempts.
- JWT token type checks for access and refresh tokens.
- Auth route rate limiting.
- Runtime environment validation for production secrets and MongoDB configuration.
- Frontend security headers through Next.js middleware.
- Security safety script for committed placeholder and auth-policy checks.

## Password Policy

Passwords must:

- be 8 to 128 characters
- include an uppercase letter
- include a lowercase letter
- include a number

This is a baseline policy. A real production launch should add password reset token persistence, email verification, device/session review, and optional MFA.

## JWT Flow

- Access tokens include `typ=access`.
- Refresh tokens include `typ=refresh`.
- Refresh token hashes are stored server-side.
- Invalid token types are rejected.

## Production Environment Rules

In production:

- `MONGO_URI` is required.
- `JWT_ACCESS_SECRET` must be strong and not a development placeholder.
- `JWT_REFRESH_SECRET` must be strong and not a development placeholder.
- `CLIENT_URL` should use HTTPS.

## Current Limits

- Account lock duration is fixed at 15 minutes.
- Admin creation remains manual.
- Password reset still needs a real email-token persistence flow before public launch.
