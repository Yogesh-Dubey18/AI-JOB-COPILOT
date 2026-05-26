# Job Aggregation and Deduplication

This document details the architecture, parsing mechanisms, deduplication rules, and apply readiness scoring for the manual and curated job aggregation system.

---

## 1. Job Normalization Model

Every job imported manually (via url/text) or via seed data is normalized using the backend `normalizeJobSourceJob` utility in `job-source.service.ts`. This sanitizes:
- **Title, Company, and Location**: Trimmed and normalized for database indexes.
- **Skills Required**: Split from arrays or parsed comma/newline separated strings.
- **Apply URL & Trust Scoring**: Evaluated against scam risk patterns (fees, personal emails, or high salary flags).
- **Source Badging**: Tagged with source types (`manual` / `curated` / `api-provider` / `partner-feed`) to render honest badges in the UI.

---

## 2. Duplicate Detection Architecture

Duplicate detection operates on two layers when a job is imported manually:
1. **duplicateKey Hash Check**: Computes a unique string composed of normalized company name, job title, location, and apply URL host (e.g., `react developer|pixelcraft labs|bengaluru|lever co`).
2. **Title, Company & Location Match Check**: Performs a database lookup for any existing approved role that matches the exact title, company, and location.

If a duplicate is found, the system:
- Prevents database duplicate writes.
- Prompts the user with a warning dialog in the frontend import form: `⚠️ Warning: A duplicate job with the same company and title already exists.`

---

## 3. URL and Text Copypasta Extraction Engine

Since automated scraping of restricted job portals (e.g. LinkedIn, Indeed) violates terms of service, users can manually copy-paste the job description text or link.

The parser uses a **two-tier extraction pipeline**:

### Tier A: AI-Powered Extraction (Live mode)
If `OPENAI_API_KEY` or `GEMINI_API_KEY` is configured in `.env`, the parser invokes the JSON schema extractor. It converts unstructured paragraphs into a clean schema of requirements, responsibilities, skills, and salaries.

### Tier B: Heuristic Parser (Fallback mode)
If AI credentials are not configured, a local deterministic parser extracts fields:
- **URL Parsing**: Heuristically extracts the company name from domain paths (e.g., Lever/Greenhouse paths) and formats titles.
- **Keyword Scanner**: Compares text against the global `technicalKeywordBank` (from the ATS scoring service) to instantly populate skills tags.
- **Structure Scanner**: Separates bullet points starting with `-`, `*`, or numbers into requirements and responsibilities based on section headings.

---

## 4. Apply Readiness Score Formula

A composite score out of 100 is calculated for every job match using:

$$\text{Apply Readiness Score} = (\text{Job Match Score} \times 0.5) + (\text{Resume ATS Score} \times 0.4) + (\text{Has Apply URL} \times 10)$$

Where:
- **Job Match Score** (0-100) measures how well the user's skills match the job listing requirements.
- **Resume ATS Score** (0-100) measures the local ATS quality level of the selected resume.
- **Has Apply URL** (+10 points) verifies the existence of a valid official application link.

---

## 5. Compliance & Safety Gating

- **No Auto-Apply**: All applications require explicit user review and confirmation.
- **No Background Scraping**: The extension and crawler do not scrape protected sites.
- **Honest Statuses**: Every provider status label honestly identifies if the integration is `Live` (keys configured) or `Provider-ready` (unconfigured fallback).
