# Rollback Runbook

This runbook defines emergency recovery procedures to roll back deployments, revert git tags, and restore database indexes if a production release fails.

---

## 🖥️ 1. Frontend Rollback (Vercel)

If the live frontend has client-side exceptions or compilation bugs:
1. Open the [Vercel Dashboard](https://vercel.com).
2. Go to **AI Job Copilot Frontend** → **Deployments**.
3. Locate the last stable deployment (pre-dating the current failing build).
4. Click the three dots menu (...) next to it and select **Redeploy**.
5. Select **Redeploy** to promote it to Production immediately.
6. Verify the live homepage renders correctly.

---

## ⚙️ 2. Backend Rollback (Render)

If the Render backend `/health` endpoint crashes or returns 502/504 gateway errors:
1. Log in at [Render Dashboard](https://dashboard.render.com).
2. Select your Web Service: **ai-job-copilot-backend**.
3. Under **Events**, locate the last successful build deployment.
4. Click **Deploy last successful build** or manually trigger a redeploy from the stable commit hash.
5. Watch the build log stream until Mongoose DB connections report: `{ db: "connected" }`.

---

## 🐙 3. Git Commits & Release Tags Rollback

If a release tag needs to be reverted because of pre-tag check errors:

### Reverting Tag Locally & Remotely
```bash
# 1. Delete the local tag
git tag -d v2.0.0-beta

# 2. Delete the tag on the remote origin
git push origin --delete v2.0.0-beta
```

### Reverting the Last Commit on Main
```bash
# Reset the local branch to the commit prior to main HEAD
git reset --hard HEAD~1

# Force push the revert to remote (Caution: Only if required by administrators)
git push origin main --force
```
