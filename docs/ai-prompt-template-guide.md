# AI Prompt Template Guide

Prompt files live in `backend/src/ai/prompts`. Each prompt builder should stay focused on one feature and return a plain string that can be wrapped by the central guardrail layer.

## Template Structure

Use this structure for each prompt:

1. Role: identify AI Job Copilot as a truthful career assistant.
2. Feature: state the exact feature, such as resume analysis or job matching.
3. Truth constraints: do not invent experience, skills, employers, or dates.
4. Output contract: require strict JSON for the route schema.
5. Context: serialize only the needed user, resume, job, or application data.

## Output Rules

- Return JSON only.
- Match the Zod schema in `backend/src/ai/schemas/outputs.ts`.
- Prefer arrays for suggestions, risks, keywords, and next actions.
- Use concise recruiter-friendly language.
- Say what is missing when the source data is incomplete.

## Safety Rules

- Never say an application was submitted.
- Never say a recruiter was contacted.
- Never add unknown skills or fake commercial experience.
- Never ask for or repeat API keys, passwords, tokens, or private keys.
- Generated emails, cover letters, LinkedIn messages, WhatsApp messages, and referral notes are review-only drafts.

## Adding A New AI Feature

1. Add a prompt file in `backend/src/ai/prompts`.
2. Add or reuse a Zod output schema in `backend/src/ai/schemas/outputs.ts`.
3. Add a fallback response in `backend/src/ai/ai.service.ts`.
4. Route the feature through `run(...)` so guardrails, fallback, schema validation, and usage tracking apply.
5. Add an API test that works without provider keys.
6. Document any new environment variable or provider dependency.

## Manual Review Checklist

- The prompt does not request fabricated credentials or fake experience.
- The fallback output is realistic and clearly draft-oriented.
- The schema rejects malformed provider output.
- The frontend does not expose provider keys or internal prompts.
- The feature still works with `AI_PROVIDER=mock`.
