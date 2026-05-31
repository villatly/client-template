import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Infoteclive Publisher",
  robots: { index: false },
};

const NAVY  = "#0F2027";
const GOLD  = "#C9A84C";
const CREAM = "#FAFAF7";
const MUTED = "#8a9ab0";

export default function AppPrivacyPage() {
  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ borderBottom: `1px solid #1e3a52`, padding: "20px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Icon */}
            <svg width="32" height="32" viewBox="0 0 100 100">
              <rect width="100" height="100" rx="18" fill={GOLD} />
              <polygon points="28,18 28,82 82,50" fill={NAVY} />
            </svg>
            <span style={{ fontWeight: 700, fontSize: 16, color: CREAM }}>Infoteclive Publisher</span>
          </div>
          <nav style={{ display: "flex", gap: 24, fontSize: 13 }}>
            <span style={{ color: GOLD, borderBottom: `1px solid ${GOLD}`, paddingBottom: 2 }}>Privacy Policy</span>
            <Link href="/app-terms" style={{ color: MUTED, textDecoration: "none" }}>Terms of Service</Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 80px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 6, color: CREAM }}>Privacy Policy</h1>
        <p style={{ color: MUTED, fontSize: 13, marginBottom: 48 }}>Last updated: May 2025</p>

        {[
          {
            title: "1. Who We Are",
            body: "This application is a personal automation tool used exclusively by its owner to publish short video content to authorised social media accounts. It is not a public service and does not collect data from any third parties or viewers.",
          },
          {
            title: "2. Data We Access",
            body: "This app requests permission to publish videos to TikTok on behalf of the authorised account owner. It accesses only the permissions explicitly granted during the OAuth authorisation flow. We do not collect, store, or share any personal data from TikTok users or viewers.",
          },
          {
            title: "3. How We Use the Data",
            body: "The sole purpose of this application is to upload video content to the authorised TikTok account. No data is used for advertising, analytics, profiling, or any purpose other than video publishing.",
          },
          {
            title: "4. Data Sharing",
            body: "We do not sell, share, or transfer any data to third parties. Access tokens are stored locally on the operator's own device and are never transmitted to external servers.",
          },
          {
            title: "5. Data Retention",
            body: "Access tokens are stored locally and can be revoked at any time from the TikTok account settings. No other data is retained by this application.",
          },
          {
            title: "6. Contact",
            body: null,
            contact: "gaspab06@gmail.com",
          },
        ].map((s) => (
          <section key={s.title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: GOLD, marginBottom: 10 }}>{s.title}</h2>
            {s.body && <p style={{ color: "#c8d8e8", lineHeight: 1.75, margin: 0 }}>{s.body}</p>}
            {s.contact && (
              <p style={{ color: "#c8d8e8", lineHeight: 1.75, margin: 0 }}>
                For any questions regarding this privacy policy, contact:{" "}
                <a href={`mailto:${s.contact}`} style={{ color: GOLD }}>{s.contact}</a>
              </p>
            )}
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid #1e3a52`, padding: "24px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", display: "flex", gap: 24, fontSize: 13, color: MUTED }}>
          <span style={{ color: GOLD }}>Privacy Policy</span>
          <Link href="/app-terms" style={{ color: MUTED, textDecoration: "none" }}>Terms of Service</Link>
        </div>
      </footer>

    </div>
  );
}
