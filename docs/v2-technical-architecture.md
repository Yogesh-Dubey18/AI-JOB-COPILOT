# v2 Technical Architecture

## Frontend

- Next.js App Router.
- Feature folders for resume, jobs, applications, interviews, analytics, admin, billing, and settings.
- TanStack Query for API state.
- Reusable empty/loading/error components.
- Error boundary and monitoring abstraction.

## Backend

- Express TypeScript API.
- Controller/service/repository structure.
- Mongoose models with indexes.
- Provider abstractions for AI, email, billing, calendar, storage, and monitoring.
- Request IDs and structured logging.
- Rate limits and validation at boundaries.

## Data Flow

1. User action in frontend.
2. API client calls backend.
3. Auth middleware validates user.
4. Service layer handles business logic.
5. Repository/model persists data.
6. Provider layer calls external service or mock fallback.
7. Response is normalized for frontend.
