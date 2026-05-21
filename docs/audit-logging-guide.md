# Audit Logging Guide

Audit logs record sensitive operational actions across the API. They are designed for debugging, security review, admin accountability, and future compliance work.

## What Is Logged

- Mutating API requests.
- Auth, admin, billing, and AI requests.
- Admin access denials.
- Status code, method, path, category, actor, role, IP, user agent, and risk level.

## What Is Not Logged

- Raw passwords.
- Resume file contents.
- Provider API keys.
- JWT refresh tokens.
- Private keys.
- Full request bodies.

## Categories

- `auth`
- `resume`
- `jobs`
- `applications`
- `interviews`
- `ai`
- `billing`
- `notifications`
- `admin`

## Risk Levels

- `low`: normal successful operations.
- `medium`: failed or denied sensitive operations.
- `high`: reserved for future suspicious pattern detection.

## Admin Review

Use `GET /api/admin/audit-logs` or the admin audit logs page to review recent events. Look for repeated admin denials, failing billing changes, unusual AI usage, or risky job moderation activity.

## Production TODO

- Add retention policy.
- Add export controls.
- Add pagination and filters.
- Add alerting for repeated medium/high risk events.
- Review log privacy with a qualified professional before commercial launch.
