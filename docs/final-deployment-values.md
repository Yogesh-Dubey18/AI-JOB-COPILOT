# Final Deployment Values

Use this file to collect values during real deployment. Keep placeholders in Git until values are verified and safe to publish.

## Frontend

- Vercel project name: `ai-job-copilot-frontend`
- Frontend live URL: `https://your-frontend.example.com`
- `NEXT_PUBLIC_API_URL`: `https://your-backend.example.com/api`

## Backend

- Backend service name: `ai-job-copilot-backend`
- Backend live URL: `https://your-backend.example.com`
- Backend health URL: `https://your-backend.example.com/health`
- `CLIENT_URL`: `https://your-frontend.example.com`

## Database

- MongoDB Atlas cluster:
- Database name:
- Connection string stored in backend env as `MONGO_URI`.

## Provider Keys

- JWT secrets: backend env only.
- AI provider keys: backend env only.
- Email keys: backend env only.
- Billing keys: backend env only.

Do not paste real secrets into this file.
