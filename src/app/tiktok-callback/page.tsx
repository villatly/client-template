"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const NAVY = "#0F2027";
const GOLD = "#C9A84C";
const CREAM = "#FAFAF7";
const MUTED = "#8a9ab0";

function CallbackContent() {
  const params = useSearchParams();
  const code  = params.get("code");
  const error = params.get("error");

  return (
    <div style={{ background: NAVY, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 560, width: "100%", padding: "0 24px", textAlign: "center" }}>

        <svg width="56" height="56" viewBox="0 0 100 100" style={{ marginBottom: 24 }}>
          <rect width="100" height="100" rx="18" fill={GOLD} />
          <polygon points="28,18 28,82 82,50" fill={NAVY} />
        </svg>

        {error ? (
          <>
            <h1 style={{ fontSize: 24, color: "#ff6b6b", marginBottom: 12 }}>Authorization failed</h1>
            <p style={{ color: MUTED }}>{error}</p>
          </>
        ) : code ? (
          <>
            <h1 style={{ fontSize: 24, color: CREAM, marginBottom: 8 }}>Authorization complete</h1>
            <p style={{ color: MUTED, marginBottom: 32 }}>Copy the code below and paste it into the terminal.</p>
            <div style={{
              background: "#0a1820",
              border: `1px solid ${GOLD}`,
              borderRadius: 10,
              padding: "20px 24px",
              marginBottom: 16,
              wordBreak: "break-all",
              fontSize: 13,
              color: GOLD,
              fontFamily: "monospace",
              textAlign: "left",
            }}>
              {code}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              style={{
                background: GOLD,
                color: NAVY,
                border: "none",
                borderRadius: 8,
                padding: "12px 28px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Copy code
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, color: CREAM, marginBottom: 12 }}>Waiting for authorization...</h1>
            <p style={{ color: MUTED }}>No code received yet.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function TikTokCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
