import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Infoteclive Publisher",
  description: "Personal automation tool to publish short video content to social media platforms.",
  robots: { index: false },
};

const NAVY  = "#0F2027";
const GOLD  = "#C9A84C";
const CREAM = "#FAFAF7";
const MUTED = "#8a9ab0";
const CARD  = "#132330";

export default function AppHomePage() {
  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ borderBottom: `1px solid #1e3a52`, padding: "20px 0" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 100 100">
              <rect width="100" height="100" rx="18" fill={GOLD} />
              <polygon points="28,18 28,82 82,50" fill={NAVY} />
            </svg>
            <span style={{ fontWeight: 700, fontSize: 16, color: CREAM }}>Infoteclive Publisher</span>
          </div>
          <nav style={{ display: "flex", gap: 24, fontSize: 13 }}>
            <Link href="/app-privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacy Policy</Link>
            <Link href="/app-terms" style={{ color: MUTED, textDecoration: "none" }}>Terms of Service</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "80px 24px 64px", textAlign: "center" }}>
        <div style={{ marginBottom: 32 }}>
          <svg width="72" height="72" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="22" fill={GOLD} />
            <polygon points="28,18 28,82 82,50" fill={NAVY} />
          </svg>
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
          Infoteclive Publisher
        </h1>
        <p style={{ fontSize: 18, color: MUTED, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
          A personal automation tool for publishing short video content
          to social media platforms — simply and efficiently.
        </p>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {[
            { icon: "▶", title: "Automated Publishing", desc: "Schedule and publish short videos to your accounts automatically." },
            { icon: "⚡", title: "Fast & Lightweight", desc: "Runs locally with no external dependencies or subscriptions." },
            { icon: "🔒", title: "Private by Design", desc: "No data collection. Tokens stored locally on your own device." },
          ].map((f) => (
            <div key={f.title} style={{ background: CARD, borderRadius: 12, padding: "28px 24px", border: `1px solid #1e3a52` }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: CREAM, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid #1e3a52`, padding: "24px 0" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px", display: "flex", gap: 24, fontSize: 13, color: MUTED }}>
          <Link href="/app-privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacy Policy</Link>
          <Link href="/app-terms" style={{ color: MUTED, textDecoration: "none" }}>Terms of Service</Link>
          <span style={{ marginLeft: "auto" }}>© 2025 Infoteclive Publisher</span>
        </div>
      </footer>

    </div>
  );
}
