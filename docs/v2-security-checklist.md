# v2 Security Checklist

## Auth

- Strong JWT secrets.
- Refresh token hashing.
- HttpOnly cookies.
- Secure cookie settings in production.
- Rate limit auth routes.

## API

- Validate all inputs.
- Enforce user data isolation.
- Use safe error responses.
- Add request IDs.
- Avoid leaking stack traces in production.

## Files

- Validate type and size.
- Scan high-risk upload paths.
- Keep uploads out of git.
- Use provider storage for production.

## AI

- Do not send secrets to AI providers.
- Minimize prompt data.
- Track usage.
- Cache repeated outputs when safe.

## Repo

- Run git safety checks.
- Keep `.env.example` placeholder-only.
- Never commit real keys.
