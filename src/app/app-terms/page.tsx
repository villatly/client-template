import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Developer App",
  robots: { index: false },
};

export default function AppTermsPage() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "60px auto", padding: "0 24px", color: "#222" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Terms of Service</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 40 }}>Last updated: May 2025</p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>1. About This Application</h2>
      <p>
        This is a personal automation tool used exclusively by its owner to publish short video content
        to authorised social media accounts. It is not a public service and is not available to third parties.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>2. Acceptance of Terms</h2>
      <p>
        By using this application, you confirm that you are the authorised owner of the social media
        accounts connected to it and that you accept full responsibility for any content published through it.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>3. Permitted Use</h2>
      <p>
        This application may only be used to publish original content owned by the operator to their own
        social media accounts. It may not be used to publish content that violates the terms of service
        of any connected platform (including TikTok).
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>4. Content Responsibility</h2>
      <p>
        The operator is solely responsible for all content published through this application. The application
        does not review, moderate, or endorse any content. All published content must comply with applicable
        laws and platform community guidelines.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>5. No Warranties</h2>
      <p>
        This application is provided as-is for personal use. No guarantees are made regarding uptime,
        availability, or fitness for any particular purpose.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>6. Limitation of Liability</h2>
      <p>
        The operator of this application shall not be liable for any damages arising from its use,
        including but not limited to account suspensions, content removal, or data loss.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>7. Changes to These Terms</h2>
      <p>
        These terms may be updated at any time. Continued use of the application constitutes acceptance
        of the updated terms.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>8. Contact</h2>
      <p>
        For any questions regarding these terms, contact:{" "}
        <a href="mailto:gaspab06@gmail.com" style={{ color: "#0070f3" }}>gaspab06@gmail.com</a>
      </p>
    </div>
  );
}
