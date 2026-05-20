# Troubleshooting Guide

## MongoDB Is Not Configured

The backend logs `MONGO_URI not configured. Using in-memory fallback store.` This is expected for local demos and tests. Add `MONGO_URI` in `backend/.env` for persistent data.

## AI Keys Are Missing

OpenAI and Gemini keys are optional. Without keys, AI endpoints return structured mock fallback responses and still save outputs where applicable.

## Redis Is Missing

BullMQ queues use a safe fallback object when `REDIS_URL` is empty. Add Redis for production background processing.

## Frontend Cannot Reach Backend

Confirm `NEXT_PUBLIC_API_URL=http://localhost:5000/api` in `frontend/.env.local`, and make sure the backend health endpoint returns 200 at `http://localhost:5000/health`.

## Resume Upload Fails

Only PDF, DOCX, and TXT files under 5 MB are accepted. TXT has the best local text extraction. PDF and DOCX use a rough local fallback unless a richer parser is added.

## Tests Warn About Chart Dimensions

Recharts may warn under jsdom because there is no real layout engine. The tests still pass; browser rendering uses real element dimensions.

## Ports Are Busy

Stop the process using port 3000 or 5000, or run the frontend/backend separately with custom port settings.
