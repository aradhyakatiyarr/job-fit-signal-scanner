"use client";

import { useState } from "react";
import { Sparkles, FileDown, Loader2, File } from "lucide-react";
import { generateDocx, generatePdf } from "../lib/generateDocs";

export default function ResumeGenerator({ jobDescription, resume }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resume }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't generate a tailored resume.");
      setData(json);
    } catch (e) {
      setError(e.message || "Couldn't generate a tailored resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel-block">
      <h3>Tailored resume for this job</h3>

      {!data && (
        <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={15} className="spin" /> Rewriting your resume for this role...
            </>
          ) : (
            <>
              <Sparkles size={15} /> Generate tailored resume
            </>
          )}
        </button>
      )}

      {error && <div className="error-box">ERROR — {error}</div>}

      {data && (
        <div className="resume-preview">
          <div className="resume-preview-head">
            <div>
              <div className="resume-name">{data.name}</div>
              {data.title && <div className="resume-title">{data.title}</div>}
            </div>
            <div className="download-group">
              <button className="download-btn" onClick={() => generateDocx(data)}>
                <FileDown size={14} /> .docx
              </button>
              <button className="download-btn" onClick={() => generatePdf(data)}>
                <File size={14} /> .pdf
              </button>
            </div>
          </div>
          {data.summary && <p className="resume-summary">{data.summary}</p>}
          {data.skills?.length > 0 && (
            <div className="resume-skills">{data.skills.join("  ·  ")}</div>
          )}
          <button className="regenerate" onClick={handleGenerate} disabled={loading}>
            {loading ? "Regenerating..." : "Regenerate"}
          </button>
        </div>
      )}
    </div>
  );
}
