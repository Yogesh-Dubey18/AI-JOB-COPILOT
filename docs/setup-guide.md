# Setup Guide

1. Install Node.js 20+ and MongoDB Atlas or local MongoDB.
2. Run `npm install` from the repo root.
3. Copy env examples and set `MONGO_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.
4. Run `npm run seed --prefix backend`.
5. Run `npm run dev`.

If MongoDB is not configured, the backend uses an in-memory fallback for local demos and tests.
