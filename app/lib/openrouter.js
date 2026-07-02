// Small wrapper around OpenRouter's chat API.
// OpenRouter speaks the same "shape" as OpenAI's API, so every request
// looks like: { model, messages: [{role, content}, ...] }
// We default to "openrouter/free" - a router that auto-picks whichever
// free model on OpenRouter fits the request (text-only or with an image).

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/free";

export async function callOpenRouter({ systemPrompt, userContent }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ConfigError(
      "Server is missing OPENROUTER_API_KEY. Add it in Vercel → Project Settings → Environment Variables, then redeploy."
    );
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // OpenRouter uses these two (optional) headers for its public leaderboard
      "HTTP-Referer": "https://job-fit-signal-scanner.vercel.app",
      "X-Title": "Job-Fit Signal Scanner",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new UpstreamError(
      `OpenRouter error (${res.status}): ${errText.slice(0, 300)}`
    );
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  if (!text.trim()) {
    throw new UpstreamError(
      "The free model returned an empty response. This happens sometimes under load - try again."
    );
  }
  return text;
}

// Strips markdown code fences and parses JSON, throwing a clear error if the
// free model didn't follow instructions (free models are less reliable at
// strict formatting than paid models, so we handle this explicitly).
export function parseJsonResponse(raw) {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to salvage a JSON object if the model added stray text around it
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    throw new UpstreamError(
      "The AI model's output wasn't valid JSON. Free models occasionally do this - try again."
    );
  }
}

export class ConfigError extends Error {}
export class UpstreamError extends Error {}
