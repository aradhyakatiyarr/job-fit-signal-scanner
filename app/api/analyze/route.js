import { callOpenRouter, parseJsonResponse, ConfigError, UpstreamError } from "../../lib/openrouter";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a hiring-signal analyst. You compare a job description against a candidate resume and output ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:

{
  "overall_score": <integer 0-100, weighted average of the four category scores>,
  "categories": [
    { "name": "Skills Match", "score": <0-100> },
    { "name": "Experience Level", "score": <0-100> },
    { "name": "Domain Relevance", "score": <0-100> },
    { "name": "Keyword Alignment", "score": <0-100> }
  ],
  "strengths": [<2-4 short strings, specific to this resume and this job, not generic>],
  "gaps": [<2-4 short strings naming exactly what's missing or weak, specific and honest, not generic>],
  "outreach_email": {
    "subject": "<short specific subject line, under 8 words>",
    "body": "<a cold outreach email, under 120 words, no corporate filler, references one specific thing from the job post and one specific thing from the resume, ends with a clear low-effort ask>"
  }
}

Be honest and specific. Do not inflate scores to be encouraging. If the resume is a weak fit, say so in the gaps and reflect it in the score. Ground every strength and gap in actual text from the job description or resume - never invent details. Output ONLY the JSON object, nothing before or after it.`;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { jobDescription, resume } = body || {};
  if (!jobDescription?.trim() || !resume?.trim()) {
    return Response.json(
      { error: "Both jobDescription and resume are required." },
      { status: 400 }
    );
  }

  try {
    const raw = await callOpenRouter({
      systemPrompt: SYSTEM_PROMPT,
      userContent: `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE RESUME:\n${resume}`,
    });
    const parsed = parseJsonResponse(raw);

    if (typeof parsed.overall_score !== "number" || !Array.isArray(parsed.categories)) {
      return Response.json(
        { error: "The model's response was missing expected fields. Try scanning again." },
        { status: 502 }
      );
    }

    return Response.json(parsed);
  } catch (err) {
    if (err instanceof ConfigError) {
      return Response.json({ error: err.message }, { status: 500 });
    }
    if (err instanceof UpstreamError) {
      return Response.json({ error: err.message }, { status: 502 });
    }
    return Response.json({ error: err.message || "Unexpected server error." }, { status: 500 });
  }
}
