import { callOpenRouter, ConfigError, UpstreamError } from "../../lib/openrouter";

export const runtime = "nodejs";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return Response.json({ error: "No file received." }, { status: 400 });
    }

    const type = file.type;
    const name = file.name || "upload";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Plain text files
    if (type === "text/plain" || name.endsWith(".txt")) {
      return Response.json({ text: buffer.toString("utf-8") });
    }

    // PDFs - parsed with pdf-parse (runs on the server, no upload needed to a third party)
    if (type === "application/pdf" || name.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      const text = (parsed.text || "").trim();
      if (!text) {
        return Response.json(
          { error: "Couldn't find any text in that PDF. If it's a scanned image, try a screenshot instead." },
          { status: 422 }
        );
      }
      return Response.json({ text });
    }

    // Word docs - parsed with mammoth
    if (
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value || "").trim();
      if (!text) {
        return Response.json({ error: "Couldn't find any text in that document." }, { status: 422 });
      }
      return Response.json({ text });
    }

    // Images / screenshots - read via a vision-capable free model on OpenRouter
    if (IMAGE_TYPES.includes(type)) {
      const base64 = buffer.toString("base64");
      const dataUri = `data:${type};base64,${base64}`;

      const raw = await callOpenRouter({
        systemPrompt:
          "You transcribe text from images exactly as it appears. Output ONLY the transcribed text, preserving line breaks and structure. No commentary, no markdown, no code fences.",
        userContent: [
          {
            type: "text",
            text: "Transcribe every piece of text visible in this image, in order.",
          },
          { type: "image_url", image_url: { url: dataUri } },
        ],
      });

      const text = raw.trim();
      if (!text) {
        return Response.json(
          { error: "Couldn't read any text from that image. Try a clearer screenshot." },
          { status: 422 }
        );
      }
      return Response.json({ text });
    }

    return Response.json(
      { error: `Unsupported file type: ${type || "unknown"}. Use PDF, DOCX, TXT, PNG, or JPG.` },
      { status: 415 }
    );
  } catch (err) {
    if (err instanceof ConfigError) {
      return Response.json({ error: err.message }, { status: 500 });
    }
    if (err instanceof UpstreamError) {
      return Response.json({ error: err.message }, { status: 502 });
    }
    return Response.json(
      { error: err.message || "Couldn't process that file." },
      { status: 500 }
    );
  }
}
