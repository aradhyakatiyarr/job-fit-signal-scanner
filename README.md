# Job-Fit Signal Scanner

**Live demo:** _(add your Vercel URL here)_

## Problem

Job seekers apply broadly and write generic outreach because scoring your own fit against a posting, and turning that into a sharp cold email, takes real time per application. Recruiters equally get flooded with outreach that ignores what the role actually asks for.

## Approach

A Next.js app with a single serverless API route. The user pastes a job description and their resume; the backend sends both to Claude with a fixed evaluation rubric (skills match, experience level, domain relevance, keyword alignment) and gets back a structured JSON score, a specific strengths/gaps breakdown, and a draft outreach email — grounded only in text actually present in the two inputs, not invented.

**Stack:** Next.js 14 (App Router), Claude API (`claude-sonnet-5`), deployed on Vercel.

## Why a fixed rubric, not a free-form LLM answer

Scoring is broken into four weighted categories instead of one number so the output is auditable — you can see *why* a fit is scored the way it is, not just trust a black box. This is the same reason eval frameworks matter in production AI products: a score without a rubric isn't a signal, it's a guess.

## Trade-offs

- **No resume parsing/upload** — plain text paste only, to ship fast. A v2 would accept PDF/DOCX.
- **Single-shot scoring** — no caching or reuse across scans of the same resume against multiple JDs yet.
- **Honesty over encouragement** — the prompt explicitly instructs the model not to inflate scores. This was a deliberate product call: a flattering tool is a useless tool.

## What I'd improve next

- Batch mode: scan one resume against multiple job postings at once.
- Save scan history so gaps become a personal "skills to close" tracker over time.
- A/B test two outreach email tones and track reply rates.

---
Built by Aradhya Katiyar.
