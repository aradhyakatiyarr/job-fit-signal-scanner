import { callOpenRouter, parseJsonResponse, ConfigError, UpstreamError } from "../../lib/openrouter";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You rewrite resumes to better match a specific job description, using ONLY facts already present in the candidate's original resume. You never invent employers, titles, dates, degrees, or skills that aren't in the source resume. Your job is to reorder, re-emphasize, and re-word what's already true - not fabricate.

Output ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:

{
  "name": "<from resume, or 'Your Name' if not found>",
  "title": "<a short professional title tailored to the target job, based on the candidate's real background>",
  "contact": "<any contact info found in the resume - email/phone/location - as a single line, or empty string if none found>",
  "summary": "<2-3 sentence professional summary tailored to this job, grounded only in real resume facts>",
  "skills": [<6-12 short skill strings, prioritizing ones relevant to the job description, pulled only from the resume>],
  "experience": [
    {
      "role": "<job title from resume>",
      "org": "<company/organization from resume>",
      "duration": "<dates if present in resume, else empty string>",
      "bullets": [<2-4 bullet strings, reworded/reordered to emphasize relevance to the target job, grounded in resume facts>]
    }
  ],
  "projects": [
    {
      "name": "<project name from resume>",
      "description": "<1-2 sentences, tailored emphasis, grounded in resume facts>"
    }
  ],
  "education": [
    { "degree": "<from resume>", "school": "<from resume>", "year": "<from resume, or empty string>" }
  ]
}

If a section (projects, education, etc.) isn't present in the source resume, return an empty array for it - do not invent entries. Output ONLY the JSON object, nothing before or after it.`;

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
      userContent: `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE'S ORIGINAL RESUME:\n${resume}`,
    });
    const parsed = parseJsonResponse(raw);

    if (!parsed.name || !Array.isArray(parsed.skills)) {
      return Response.json(
        { error: "The model's response was missing expected fields. Try generating again." },
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
