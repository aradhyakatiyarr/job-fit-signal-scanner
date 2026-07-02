"use client";

import { useState, useEffect, useRef } from "react";

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
      setError("Paste both a job description and your resume before scanning.");
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
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
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
    <main className="wrap">
      <div className="eyebrow">Job-Fit Signal Scanner</div>
      <h1>Know your fit before you hit send.</h1>
      <p className="sub">
        Paste a job description and your resume. Get a scored breakdown of
        your fit, the gaps a recruiter will notice first, and a draft
        outreach email — before you spend an hour writing one from scratch.
      </p>

      <div className="grid">
        <div className="field">
          <label htmlFor="jd">Job description</label>
          <textarea
            id="jd"
            placeholder="Paste the full job posting here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="resume">Your resume</label>
          <textarea
            id="resume"
            placeholder="Paste your resume text here..."
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />
        </div>
      </div>

      <div className="actions">
        <button className="scan" onClick={handleScan} disabled={loading}>
          {loading ? "Scanning..." : "Scan fit"}
        </button>
        <button className="sample" onClick={loadSample} disabled={loading}>
          Load a sample to try it
        </button>
      </div>

      {error && <div className="error-box">ERROR — {error}</div>}

      {loading && (
        <div className="scan-panel">
          <div className="scan-line" />
          <div className="scan-status">{STATUS_MESSAGES[statusIdx]}</div>
        </div>
      )}

      {result && !loading && (
        <div className="results">
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
                    <div
                      className="bar-fill"
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  <div className="bar-value">{c.score}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-block">
            <h3>Strengths</h3>
            <ul className="list strengths">
              {result.strengths?.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="panel-block">
            <h3>Gaps a recruiter will notice</h3>
            <ul className="list gaps">
              {result.gaps?.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>

          <div className="panel-block">
            <h3>Draft outreach email</h3>
            <div className="email-box">
              <button className="copy" onClick={copyEmail}>
                {copied ? "Copied" : "Copy"}
              </button>
              <div className="email-subject">
                Subject: {result.outreach_email?.subject}
              </div>
              <div>{result.outreach_email?.body}</div>
            </div>
          </div>
        </div>
      )}

      <footer>
        Scoring is generated by an LLM against four weighted categories —
        skills match, experience level, domain relevance, and keyword
        alignment — and is meant as a directional signal, not a guarantee.
        Built by Aradhya Katiyar.
      </footer>
    </main>
  );
}
