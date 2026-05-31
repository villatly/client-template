import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Developer App",
  robots: { index: false },
};

export default function AppPrivacyPage() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "60px auto", padding: "0 24px", color: "#222" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 40 }}>Last updated: May 2025</p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>1. Who We Are</h2>
      <p>
        This application is a personal automation tool used to publish short video content to social media
        platforms (including TikTok) on behalf of the account owner. It is not a public service and does
        not collect data from any third parties or viewers.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>2. Data We Access</h2>
      <p>
        This app requests permission to publish videos to TikTok on behalf of the authorised account owner.
        It accesses only the permissions explicitly granted during the OAuth authorisation flow.
        We do not collect, store, or share any personal data from TikTok users or viewers.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>3. How We Use the Data</h2>
      <p>
        The sole purpose of this application is to upload video content to the authorised TikTok account.
        No data is used for advertising, analytics, profiling, or any purpose other than video publishing.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>4. Data Sharing</h2>
      <p>
        We do not sell, share, or transfer any data to third parties. Access tokens are stored locally
        on the operator&apos;s own device and are never transmitted to external servers.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>5. Data Retention</h2>
      <p>
        Access tokens are stored locally and can be revoked at any time from the TikTok account settings.
        No other data is retained by this application.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>6. Contact</h2>
      <p>
        For any questions regarding this privacy policy, contact:{" "}
        <a href="mailto:gaspab06@gmail.com" style={{ color: "#0070f3" }}>gaspab06@gmail.com</a>
      </p>
    </div>
  );
}
