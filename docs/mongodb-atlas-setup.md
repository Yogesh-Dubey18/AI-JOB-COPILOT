# MongoDB Atlas Setup

## Steps

1. Create a MongoDB Atlas account.
2. Create a project named `AI Job Copilot`.
3. Create a free or paid cluster.
4. Create a database user with a generated password.
5. Store the username and password only in deployment provider secrets.
6. Set network access to the backend provider IPs when possible.
7. Copy the connection string.
8. Set `MONGO_URI` in the backend host.
9. Deploy backend and check `/health`.
10. Run seed only if demo jobs are needed.

## Connection String Template

```bash
mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

## Safety

- Do not commit the connection string.
- Do not use an admin database user for the app.
- Restrict network access before public launch.
- Rotate the database password if it is exposed.
