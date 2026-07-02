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

Be honest and specific. Do not inflate scores to be encouraging. If the resume is a weak fit, say so in the gaps and reflect it in the score. Ground every strength and gap in actual text from the job description or resume — never invent details.`;

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Server is missing ANTHROPIC_API_KEY. Add it in Vercel → Project Settings → Environment Variables, then redeploy.",
      },
      { status: 500 }
    );
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE RESUME:\n${resume}`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return Response.json(
        { error: `Claude API error (${anthropicRes.status}): ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = await anthropicRes.json();
    const textBlock = data.content?.find((b) => b.type === "text");
    const raw = textBlock?.text || "";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return Response.json(
        { error: "Model output wasn't valid JSON. Try scanning again." },
        { status: 502 }
      );
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json(
      { error: err.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
