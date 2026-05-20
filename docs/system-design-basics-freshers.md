# System Design Basics For Freshers

## What To Know

- Client-server model.
- REST APIs.
- Authentication.
- Database reads and writes.
- Caching basics.
- Background jobs.
- File upload flow.
- Logging and monitoring.

## Explain AI Job Copilot At System Level

1. User logs in from frontend.
2. Backend validates JWT and routes request.
3. Resume/job/application data is stored in MongoDB-ready models.
4. AI service returns provider output or mock fallback.
5. Frontend renders dashboards and workflows.
6. Admin and analytics views monitor product usage.

## Scaling Ideas

- Move expensive AI work to queues.
- Cache repeated AI results.
- Add indexes on search/filter fields.
- Add monitoring and error tracking.
- Store files in Cloudinary/S3-style storage.
