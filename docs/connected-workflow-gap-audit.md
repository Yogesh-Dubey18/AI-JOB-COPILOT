# Connected Workflow Gap Audit

This gap audit evaluates the current end-to-end user workflow connectivity, route status, authentication persistence, and provider readiness state in **AI Job Copilot**.

---

## 📊 Current Working Features
1. **User Authentication:** Basic sign-up, sign-in, and log-out flows.
2. **Dashboard:** Renders core statistics and redirects user to active pages.
3. **Resume Upload:** Allows uploading resume files to local disk.
4. **Jobs Feed:** Static list of roles with category and experience filtering.
5. **Applications Kanban Board:** Standard status drag-and-drop or status-dropdown update flow.
6. **Recruiter CRM (`/contacts`):** Saving and viewing recruiters/contacts.
7. **Guided Workflow (`/guided-workflow`):** Static documentation of step-by-step career navigation.
8. **Feedback Submissions:** Renders standard form capturing bug reports and ratings.

---

## 🛑 Broken / Missing Routes & Features
1. **Company Research (`/company-research`):** Throws "Route not found" or "Something went wrong" because `/api/company-research` endpoint is unmapped on the backend and lacks a model.
2. **Answer Vault / Career Vault / Career Operating System (`/answer-vault`, `/career-vault`):** Missing or crashing due to lack of defined client pages or backend routes.
3. **Guided Workflow (`/guided-workflow`):** Only contains static tips; does not read the user's actual resume/job state.
4. **PDF Generator (`/pdf-export`):** Lacks ATS-friendly template layouts or storage connections.
5. **Portfolio PDF Export (`/portfolio-generator`):** Lacks public link generation or manual mock storage indicators.

---

## 🔑 Auth Persistence Issue Analysis
* **Cross-Domain Session Cookie Limitation:** Vercel frontend domain (`vercel.app`) cannot read Render backend's (`onrender.com`) HTTP-Only `accessToken` cookie.
* **Premature Cookie Expiration:** The edge middleware relies on the `ajc_session` cookie marker, which currently sets `Max-Age` based on the 15-minute `accessToken`. When it expires, the user is redirected to `/login` despite a valid `refreshToken` cookie.
* **New Tab Authentication Loss:** If a user opens a link in a new tab, `sessionStorage` is empty, causing backend requests to fail (as the `Authorization` header is omitted).
* **Missing Axios/Fetch Interceptor:** The client lacks auto-refresh logic to call `/auth/refresh` on 401 response and rehydrate session storage.

---

## 🧩 Disconnected Workflow Points
* **Resume Upload $\to$ Analyzer:** No direct redirect after upload; requires manually clicking to analyzer.
* **Analyzer $\to$ Suggestions $\to$ Job Search:** Lack of interactive "Add suggestions", "Generate updated PDF", and "Discover matching jobs" query/context transfers.
* **Job Search $\to$ Application Kit $\to$ Tracker:** Job cards contain apply links but no automated connection to generate application kits and add them directly to the CRM tracker.
* **Reply Assistant:** Recruiter messages cannot be pasted directly to generate templates matching the specific job context.

---

## 📡 Provider-Ready vs. Live Provider Status
* **Google OAuth:** Complete. Real Google OAuth callback routes are active, and forms dynamically enable/disable based on env variables backend checks.
* **S3/R2 Cloud Storage:** Provider-ready. Uses local disk storage by default. Needs magic number binary checks (`%PDF` and `PK` ZIP) and AWS SDK clients.
* **AI Engine (OpenAI/Gemini):** Fallbacks are mock-based if credentials are unset.

---

## 🛡️ Safe Implementation Plan
1. **Phase 1: Fix Auth Persistence** - Extend `ajc_session` cookie to 7 days. Implement automatic 401 retry interceptor in `api.ts` calling `/auth/refresh`.
2. **Phase 2: Google OAuth** - Add provider status routes and conditionally enable live OAuth logic if backend credentials exist.
3. **Phase 3: Password Guide** - Build a real-time validator helper on register forms matching backend requirements.
4. **Phase 4: Magic Numbers & PDF Parser** - Integrate PDF signature checks (`25 50 44 46`) and DOCX check (`50 4B 03 04`). Add a dedicated PDF parsing library (like `pdf-parse` or similar) to backend.
5. **Phases 5-13: Connected Workflows & Routes** - Register missing backend `/api/company-research` routes/model, fix Answer Vault/Career routes, build resume tailoring and ATS-friendly PDF download, and integrate guided workflows.
