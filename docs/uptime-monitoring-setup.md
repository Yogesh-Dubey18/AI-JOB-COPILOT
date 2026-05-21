# Uptime Monitoring Setup

AI Job Copilot exposes safe public endpoints that can be checked by uptime tools without credentials.

## Endpoints

- `GET /health`: liveness check. Confirms the API process is running.
- `GET /ready`: readiness check. Returns database mode and provider status without secrets.
- `GET /status`: public operational status. Shows provider modes and uptime without counts or private data.

## Recommended Checks

- Check `/health` every 1 to 5 minutes.
- Check `/ready` before switching frontend traffic to a new backend deploy.
- Alert if response status is not 200.
- Alert if response body `data.status` is not `ok` or `ready`.
- Record the `X-Request-Id` response header with incidents.

## Suggested Tools

- UptimeRobot
- Better Stack
- Render/Railway health checks
- Fly.io checks
- GitHub Actions scheduled smoke test

Do not configure uptime tools with real user tokens or provider credentials.

## Manual Smoke Command

~~~bash
curl https://your-backend-host.example.com/health
curl https://your-backend-host.example.com/ready
curl https://your-backend-host.example.com/status
~~~

Replace placeholder URLs only after deployment is real and verified.
