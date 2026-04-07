"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Two-step flow:
//   1. "request" — shows a button to send the OTP to the configured admin email
//   2. "verify"  — shows a 6-digit code input
type Step = "request" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);

  async function handleRequest() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not send code. Try again.");
      } else {
        setRequested(true);
        setStep("verify");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
      } else {
        router.push(data.redirect ?? "/admin");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">

          {step === "request" ? (
            <>
              <h1 className="text-xl font-semibold text-gray-900 text-center">Admin Access</h1>
              <p className="mt-2 text-sm text-gray-500 text-center">
                We&apos;ll send a one-time code to the configured admin email.
              </p>
              {error && (
                <p className="mt-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={handleRequest}
                disabled={loading}
                className="mt-6 w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending…" : "Send Login Code"}
              </button>
              <p className="mt-4 text-center text-xs text-gray-400">
                Only the configured admin email can receive this code.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900 text-center">Enter Code</h1>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Check your admin email for the 6-digit code.
              </p>
              <form onSubmit={handleVerify} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="code" className="block text-xs font-medium text-gray-700">
                    One-time code
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setError("");
                    }}
                    placeholder="000000"
                    autoFocus
                    autoComplete="one-time-code"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl font-mono tracking-[0.5em] shadow-sm placeholder:text-gray-300 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                {error && (
                  <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Verifying…" : "Sign In"}
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setStep("request"); setCode(""); setError(""); }}
                className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Didn&apos;t receive it? Send a new code
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
