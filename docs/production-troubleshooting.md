# Production Troubleshooting

## Backend Health Fails

- Check build logs.
- Confirm start command is `npm start`.
- Confirm backend root directory is `backend`.
- Confirm `PORT` behavior matches the host.
- Confirm required env values are present.

## Frontend Cannot Reach Backend

- Confirm `NEXT_PUBLIC_API_URL=https://your-backend-host.example.com/api`.
- Confirm backend `CLIENT_URL=https://your-frontend-host.example.com`.
- Redeploy backend after changing `CLIENT_URL`.
- Check browser console for CORS errors.

## Login Fails

- Confirm backend uses HTTPS in production.
- Confirm cookies are accepted by the browser.
- Confirm JWT secrets are configured.
- Confirm backend and frontend origins match configured CORS.

## Data Is Not Persisting

- Confirm `MONGO_URI` is configured.
- Confirm MongoDB Atlas network access allows backend host.
- Confirm database user credentials are valid.
- Check backend logs for the in-memory fallback warning.

## AI Output Looks Generic

- Confirm `OPENAI_API_KEY` or `GEMINI_API_KEY` is configured.
- Confirm `AI_PROVIDER=auto`, `openai`, or `gemini`.
- Check AI request logs and fallback rate.

## Uploads Fail

- Confirm file type is PDF, DOCX, or TXT.
- Confirm file size is below the configured limit.
- For production persistence, configure Cloudinary or durable file storage.

## Billing Does Not Open Stripe

- This is expected. Billing is mock/provider-ready until Stripe keys, price IDs, and webhooks are implemented.
