# Final MongoDB Atlas Setup

## Steps

1. Create MongoDB Atlas account or use an existing one.
2. Create a project for AI Job Copilot.
3. Create a cluster.
4. Create a database user with least required permissions.
5. Add allowed network access for the backend host.
6. Copy the connection string.
7. Store it as `MONGO_URI` in the backend hosting provider.
8. Do not commit the connection string.

## Recommended Database Names

- Development: `ai-job-copilot-dev`
- Production demo: `ai-job-copilot-prod`

## Verification

- Backend starts without connection errors.
- `/health` responds.
- Auth/profile/resume/job routes can persist data.

## Safety

- Rotate database password if it is exposed.
- Do not put Atlas credentials in frontend env.
- Keep IP/network rules intentionally scoped.
