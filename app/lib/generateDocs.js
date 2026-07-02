"use client";

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { jsPDF } from "jspdf";

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function generateDocx(data) {
  const children = [
    new Paragraph({
      text: data.name || "Your Name",
      heading: HeadingLevel.HEADING_1,
    }),
  ];

  if (data.title) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: data.title, italics: true, color: "4A5568" })],
      })
    );
  }
  if (data.contact) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: data.contact, size: 20, color: "666666" })],
      })
    );
  }

  if (data.summary) {
    children.push(section("Summary"));
    children.push(new Paragraph({ text: data.summary, spacing: { after: 200 } }));
  }

  if (data.skills?.length) {
    children.push(section("Skills"));
    children.push(new Paragraph({ text: data.skills.join("  •  "), spacing: { after: 200 } }));
  }

  if (data.experience?.length) {
    children.push(section("Experience"));
    data.experience.forEach((job) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: job.role || "", bold: true }),
            new TextRun({ text: job.org ? `  —  ${job.org}` : "" }),
            new TextRun({ text: job.duration ? `  (${job.duration})` : "", italics: true, color: "666666" }),
          ],
          spacing: { before: 120 },
        })
      );
      (job.bullets || []).forEach((b) => {
        children.push(new Paragraph({ text: b, bullet: { level: 0 } }));
      });
    });
  }

  if (data.projects?.length) {
    children.push(section("Projects"));
    data.projects.forEach((p) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: p.name || "", bold: true })],
          spacing: { before: 100 },
        })
      );
      if (p.description) children.push(new Paragraph({ text: p.description }));
    });
  }

  if (data.education?.length) {
    children.push(section("Education"));
    data.education.forEach((e) => {
      children.push(
        new Paragraph({
          text: [e.degree, e.school, e.year].filter(Boolean).join(" — "),
        })
      );
    });
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${slug(data.name)}-tailored-resume.docx`);
}

export function generatePdf(data) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const pageWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  let y = 56;

  const advance = (amount) => {
    y += amount;
    if (y > 760) {
      doc.addPage();
      y = 56;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(data.name || "Your Name", marginX, y);
  advance(22);

  if (data.title) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(90);
    doc.text(data.title, marginX, y);
    advance(16);
  }
  if (data.contact) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(data.contact, marginX, y);
    advance(22);
  }
  doc.setTextColor(20);

  const heading = (text) => {
    advance(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(text.toUpperCase(), marginX, y);
    advance(4);
    doc.setDrawColor(200);
    doc.line(marginX, y, marginX + pageWidth, y);
    advance(14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
  };

  const paragraph = (text, opts = {}) => {
    const lines = doc.splitTextToSize(text, pageWidth);
    lines.forEach((line) => {
      doc.text(line, marginX + (opts.indent || 0), y);
      advance(14);
    });
  };

  if (data.summary) {
    heading("Summary");
    paragraph(data.summary);
  }

  if (data.skills?.length) {
    heading("Skills");
    paragraph(data.skills.join("   •   "));
  }

  if (data.experience?.length) {
    heading("Experience");
    data.experience.forEach((job) => {
      doc.setFont("helvetica", "bold");
      doc.text(job.role || "", marginX, y);
      const roleWidth = doc.getTextWidth(job.role || "") + 6;
      doc.setFont("helvetica", "normal");
      const line2 = [job.org, job.duration ? `(${job.duration})` : ""].filter(Boolean).join("  ");
      doc.text(line2, marginX + roleWidth, y);
      advance(14);
      (job.bullets || []).forEach((b) => paragraph(`•  ${b}`, { indent: 4 }));
      advance(4);
    });
  }

  if (data.projects?.length) {
    heading("Projects");
    data.projects.forEach((p) => {
      doc.setFont("helvetica", "bold");
      doc.text(p.name || "", marginX, y);
      advance(14);
      doc.setFont("helvetica", "normal");
      if (p.description) paragraph(p.description);
    });
  }

  if (data.education?.length) {
    heading("Education");
    data.education.forEach((e) => {
      paragraph([e.degree, e.school, e.year].filter(Boolean).join(" — "));
    });
  }

  doc.save(`${slug(data.name)}-tailored-resume.pdf`);
}

function section(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    text,
    spacing: { before: 200, after: 80 },
  });
}

function slug(name) {
  return (name || "resume").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}
