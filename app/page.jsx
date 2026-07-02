"use client";

import { useState, useEffect, useRef } from "react";
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import InputPanel from "./components/InputPanel";
import ResumeGenerator from "./components/ResumeGenerator";

const SAMPLE_JD = `AI Product Manager - Series B startup

We're looking for an AI PM to own our conversational assistant roadmap. You'll work closely with ML engineers to ship LLM-powered features, define eval frameworks, run experiments, and translate model capabilities into product bets. 2+ years PM experience, direct experience shipping AI/ML features, comfort reading technical specs and talking to engineers, strong prioritization and stakeholder communication skills. Bonus: hands-on prompt engineering or model evaluation experience.`;

const SAMPLE_RESUME = `Aradhya Katiyar - Product Manager
B.Tech Computer Science, AKGEC (2026), specialization in Machine Learning and AI. CGPA 7.2.

Projects:
- RoadGuard AI: computer vision system predicting road accident risk in real time. Shipped and deployed end to end, from data pipeline to live inference.
- DocuMind: document intelligence tool using NLP pipelines to extract and structure information from unstructured documents.

Experience:
- AI/ML Intern, Prashasvi Autotech Solutions - Outstanding Completion. Worked on applied ML features, collaborated with engineering on model integration.

Skills: Product thinking, roadmap prioritization, stakeholder communication, Python, ML model evaluation, prompt engineering, cross-functional collaboration.`;

const STATUS_MESSAGES = [
  "Reading job description...",
  "Reading resume...",
  "Matching skills and keywords...",
  "Scoring experience fit...",
  "Drafting outreach email...",
];

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(() => {
        setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
      }, 900);
    } else {
      clearInterval(intervalRef.current);
      setStatusIdx(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [loading]);

  async function handleScan() {
    setError("");
    setResult(null);
    if (!jobDescription.trim() || !resume.trim()) {
      setError("Add both a job description and your resume before scanning.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setJobDescription(SAMPLE_JD);
    setResume(SAMPLE_RESUME);
  }

  function copyEmail() {
    if (!result?.outreach_email) return;
    const text = `Subject: ${result.outreach_email.subject}\n\n${result.outreach_email.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <nav className="topnav">
        <div className="brand">
          <ScanLine size={16} />
          <span>Job-Fit Signal Scanner</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="nav-link"
        >
          Built by Aradhya Katiyar
        </a>
      </nav>

      <main className="wrap">
        <div className="eyebrow">Step 1 — Add your inputs</div>
        <h1>Know your fit before you hit send.</h1>
        <p className="sub">
          Add a job description and your resume — paste text, or upload a
          PDF, Word doc, or screenshot. Get a scored fit breakdown, the gaps
          a recruiter will notice, a draft outreach email, and a resume
          rewritten for this exact role.
        </p>

        <div className="grid">
          <InputPanel
            id="jd"
            label="Job description"
            value={jobDescription}
            onChange={setJobDescription}
            placeholder="Paste the full job posting here..."
          />
          <InputPanel
            id="resume"
            label="Your resume"
            value={resume}
            onChange={setResume}
            placeholder="Paste your resume text here..."
          />
        </div>

        <div className="actions">
          <button className="scan" onClick={handleScan} disabled={loading}>
            {loading ? "Scanning..." : "Scan fit"}
          </button>
          <button className="sample" onClick={loadSample} disabled={loading}>
            Load a sample to try it
          </button>
        </div>

        {error && (
          <div className="error-box">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {loading && (
          <div className="scan-panel">
            <div className="scan-line" />
            <div className="scan-status">{STATUS_MESSAGES[statusIdx]}</div>
          </div>
        )}

        {result && !loading && (
          <div className="results">
            <div className="eyebrow section-eyebrow">Step 2 — Your signal read</div>

            <div className="score-panel">
              <div>
                <div className="score-number">
                  {result.overall_score}
                  <span>/100</span>
                </div>
                <div className="score-label">Signal strength</div>
              </div>
              <div className="bars">
                {result.categories?.map((c) => (
                  <div className="bar-row" key={c.name}>
                    <div className="bar-name">{c.name}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${c.score}%` }} />
                    </div>
                    <div className="bar-value">{c.score}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-block">
              <h3><CheckCircle2 size={14} /> Strengths</h3>
              <ul className="list strengths">
                {result.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="panel-block">
              <h3><AlertTriangle size={14} /> Gaps a recruiter will notice</h3>
              <ul className="list gaps">
                {result.gaps?.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>

            <div className="panel-block">
              <h3><Mail size={14} /> Draft outreach email</h3>
              <div className="email-box">
                <button className="copy" onClick={copyEmail}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <div className="email-subject">
                  Subject: {result.outreach_email?.subject}
                </div>
                <div>{result.outreach_email?.body}</div>
              </div>
            </div>

            <div className="eyebrow section-eyebrow">Step 3 — Tailor your resume</div>
            <ResumeGenerator jobDescription={jobDescription} resume={resume} />
          </div>
        )}

        <footer>
          Scoring is generated by an AI model against four weighted
          categories — skills match, experience level, domain relevance, and
          keyword alignment — and is meant as a directional signal, not a
          guarantee. Powered by OpenRouter free models. Built by Aradhya
          Katiyar.
        </footer>
      </main>
    </>
  );
}
