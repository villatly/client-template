import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Infoteclive Publisher",
  robots: { index: false },
};

const NAVY  = "#0F2027";
const GOLD  = "#C9A84C";
const CREAM = "#FAFAF7";
const MUTED = "#8a9ab0";

export default function AppTermsPage() {
  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ borderBottom: `1px solid #1e3a52`, padding: "20px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 100 100">
              <rect width="100" height="100" rx="18" fill={GOLD} />
              <polygon points="28,18 28,82 82,50" fill={NAVY} />
            </svg>
            <span style={{ fontWeight: 700, fontSize: 16, color: CREAM }}>Infoteclive Publisher</span>
          </div>
          <nav style={{ display: "flex", gap: 24, fontSize: 13 }}>
            <Link href="/app-home" style={{ color: MUTED, textDecoration: "none" }}>Home</Link>
            <Link href="/app-privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacy Policy</Link>
            <span style={{ color: GOLD, borderBottom: `1px solid ${GOLD}`, paddingBottom: 2 }}>Terms of Service</span>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 80px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 6, color: CREAM }}>Terms of Service</h1>
        <p style={{ color: MUTED, fontSize: 13, marginBottom: 48 }}>Last updated: May 2025</p>

        {[
          {
            title: "1. About This Application",
            body: "This is a personal automation tool used exclusively by its owner to publish short video content to authorised social media accounts. It is not a public service and is not available to third parties.",
          },
          {
            title: "2. Acceptance of Terms",
            body: "By using this application, you confirm that you are the authorised owner of the social media accounts connected to it and that you accept full responsibility for any content published through it.",
          },
          {
            title: "3. Permitted Use",
            body: "This application may only be used to publish original content owned by the operator to their own social media accounts. It may not be used to publish content that violates the terms of service of any connected platform, including TikTok.",
          },
          {
            title: "4. Content Responsibility",
            body: "The operator is solely responsible for all content published through this application. The application does not review, moderate, or endorse any content. All published content must comply with applicable laws and platform community guidelines.",
          },
          {
            title: "5. No Warranties",
            body: "This application is provided as-is for personal use. No guarantees are made regarding uptime, availability, or fitness for any particular purpose.",
          },
          {
            title: "6. Limitation of Liability",
            body: "The operator of this application shall not be liable for any damages arising from its use, including but not limited to account suspensions, content removal, or data loss.",
          },
          {
            title: "7. Changes to These Terms",
            body: "These terms may be updated at any time. Continued use of the application constitutes acceptance of the updated terms.",
          },
          {
            title: "8. Contact",
            body: null,
            contact: "gaspab06@gmail.com",
          },
        ].map((s) => (
          <section key={s.title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: GOLD, marginBottom: 10 }}>{s.title}</h2>
            {s.body && <p style={{ color: "#c8d8e8", lineHeight: 1.75, margin: 0 }}>{s.body}</p>}
            {s.contact && (
              <p style={{ color: "#c8d8e8", lineHeight: 1.75, margin: 0 }}>
                For any questions regarding these terms, contact:{" "}
                <a href={`mailto:${s.contact}`} style={{ color: GOLD }}>{s.contact}</a>
              </p>
            )}
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid #1e3a52`, padding: "24px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", display: "flex", gap: 24, fontSize: 13, color: MUTED }}>
          <Link href="/app-home" style={{ color: MUTED, textDecoration: "none" }}>Home</Link>
          <Link href="/app-privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacy Policy</Link>
          <span style={{ color: GOLD }}>Terms of Service</span>
        </div>
      </footer>

    </div>
  );
}
