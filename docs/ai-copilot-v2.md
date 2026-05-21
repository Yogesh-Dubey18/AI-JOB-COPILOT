# AI Copilot v2

AI Job Copilot v2 uses a provider-ready AI layer with a safe mock fallback. The product must remain usable without paid provider keys, and every generated job-search artifact remains a draft for user review.

## Provider Modes

- `AI_PROVIDER=auto`: prefer OpenAI when `OPENAI_API_KEY` is present, then Gemini when `GEMINI_API_KEY` is present, otherwise mock.
- `AI_PROVIDER=openai`: use OpenAI only when `OPENAI_API_KEY` is configured; otherwise fall back to mock.
- `AI_PROVIDER=gemini`: use Gemini only when `GEMINI_API_KEY` is configured; otherwise fall back to mock.
- `AI_PROVIDER=mock`: always use deterministic local fallback responses.

## Runtime Controls

- `AI_MODEL`: provider model override.
- `AI_TIMEOUT_MS`: provider timeout before fallback.
- `AI_RETRY_ATTEMPTS`: retry count for transient provider failures.
- `AI_MAX_PROMPT_CHARS`: maximum guarded prompt size.
- `AI_SAFETY_MODE`: currently `strict`; future modes may tune risk handling.

## Safety Guardrails

- The AI must not invent jobs, employers, skills, degrees, dates, projects, certifications, or salary history.
- Application content is draft-only. The system must not auto-apply or auto-send messages.
- Provider prompts redact common secret formats before calls.
- Oversized AI request payloads are rejected with validation errors.
- Provider output is validated with Zod schemas before it is returned to the app.

## Usage Tracking

Each AI call records:

- feature name
- provider and model
- approximate input and output token counts
- status: `success`, `mock`, `fallback`, or `schema_fallback`
- fallback usage
- validation result
- latency
- safety flags

Admin and billing surfaces should treat this as operational telemetry, not exact provider invoices.

## Production Notes

- Never expose provider keys in the frontend.
- Keep mock fallback enabled for demos and provider outages.
- Review generated job-search material before sending.
- Do not claim live provider integration unless real keys and smoke tests are configured.
