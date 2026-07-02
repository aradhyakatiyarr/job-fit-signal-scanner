# Job-Fit Signal Scanner

**Live demo:** _(add your Vercel URL here)_

## Problem

Job seekers apply broadly and write generic outreach because scoring your own fit against a posting, and turning that into a sharp cold email and a tailored resume, takes real time per application. Recruiters equally get flooded with outreach that ignores what the role actually asks for.

## Approach

A Next.js app with three serverless API routes. The user adds a job description and their resume — by pasting text or uploading a PDF, DOCX, or screenshot — and the backend:

1. **Extracts text** from any file type (PDF/DOCX parsed server-side; screenshots read via a vision-capable AI model).
2. **Scores fit** against a fixed rubric (skills match, experience level, domain relevance, keyword alignment), returning a structured JSON breakdown, honest gaps, and a draft outreach email.
3. **Generates a tailored resume** — rewritten to emphasize what matters for that specific job, grounded only in facts from the original resume — downloadable as a real `.docx` or `.pdf`.

**Stack:** Next.js 14 (App Router), OpenRouter (`openrouter/free` — auto-routes to a free model, text or vision, depending on the request), `mammoth` (DOCX parsing), `pdf-parse` (PDF parsing), `docx` + `jspdf` (client-side document generation), deployed on Vercel.

## Why a fixed rubric, not a free-form AI answer

Scoring is broken into four weighted categories instead of one number so the output is auditable — you can see *why* a fit is scored the way it is, not just trust a black box. This is the same reason eval frameworks matter in production AI products: a score without a rubric isn't a signal, it's a guess.

## Why OpenRouter free models instead of a paid API

This keeps the tool free to run and demo. The trade-off is real: free models are less reliable at strict JSON formatting than paid frontier models, so the backend defensively re-tries parsing and returns clear errors instead of silently failing. That trade-off — cost vs. reliability — is itself a product decision worth being able to explain in an interview.

## Trade-offs

- **Free-tier rate limits** (~20 requests/minute, 200/day on OpenRouter's free router) — fine for a personal demo, not for production traffic.
- **Resume generation never invents facts** — if the source resume doesn't mention something, the tailored version won't either. This was a deliberate call: a resume that lies is worse than a resume that under-sells.
- **No scan history yet** — each scan is stateless.

## What I'd improve next

- Batch mode: scan one resume against multiple job postings at once.
- Save scan history so gaps become a personal "skills to close" tracker over time.
- Let the user pick a paid model (e.g. via their own OpenRouter credits) for higher reliability when the free tier is under load.

---
Built by Aradhya Katiyar.
