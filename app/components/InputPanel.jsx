"use client";

import { useRef, useState } from "react";
import {
  ClipboardPaste,
  Upload,
  Loader2,
  FileText,
  X,
} from "lucide-react";

const ACCEPT = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp";

export default function InputPanel({ id, label, value, onChange, placeholder }) {
  const [mode, setMode] = useState("paste");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [sourceFile, setSourceFile] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't read that file.");
      onChange(data.text);
      setSourceFile(file.name);
      setMode("paste");
    } catch (e) {
      setUploadError(e.message || "Couldn't read that file.");
    } finally {
      setUploading(false);
    }
  }

  function clearSource() {
    setSourceFile("");
    onChange("");
  }

  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        <div className="mode-tabs">
          <button
            type="button"
            className={mode === "paste" ? "mode-tab active" : "mode-tab"}
            onClick={() => setMode("paste")}
          >
            <ClipboardPaste size={13} /> Paste
          </button>
          <button
            type="button"
            className={mode === "upload" ? "mode-tab active" : "mode-tab"}
            onClick={() => setMode("upload")}
          >
            <Upload size={13} /> Upload
          </button>
        </div>
      </div>

      {sourceFile && (
        <div className="source-badge">
          <FileText size={12} />
          <span>{sourceFile}</span>
          <button type="button" onClick={clearSource} aria-label="Clear">
            <X size={12} />
          </button>
        </div>
      )}

      {mode === "paste" ? (
        <textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          className={dragOver ? "dropzone dragover" : "dropzone"}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {uploading ? (
            <>
              <Loader2 size={22} className="spin" />
              <p>Reading file...</p>
            </>
          ) : (
            <>
              <Upload size={22} />
              <p>Drop a file here, or click to browse</p>
              <span className="dropzone-hint">PDF, DOCX, TXT, or a screenshot (PNG/JPG)</span>
            </>
          )}
        </div>
      )}

      {uploadError && <div className="field-error">{uploadError}</div>}
    </div>
  );
}
