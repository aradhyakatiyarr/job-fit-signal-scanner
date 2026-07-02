import "./globals.css";

export const metadata = {
  title: "Job-Fit Signal Scanner",
  description:
    "Paste a job description and your resume. Get a scored fit breakdown, gap analysis, and a draft outreach email — in seconds.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
