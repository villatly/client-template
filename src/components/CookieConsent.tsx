"use client";

import { useState, useEffect } from "react";

/**
 * GDPR-compliant cookie consent banner.
 *
 * Shows once per browser session if consent hasn't been recorded.
 * On acceptance, sets localStorage "cookie_consent" = "granted" and
 * dispatches a "cookie:granted" custom event so Analytics loads GA4
 * without a page reload.
 *
 * On decline, sets "cookie_consent" = "denied" — no tracking scripts load.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function grant() {
    localStorage.setItem("cookie_consent", "granted");
    window.dispatchEvent(new CustomEvent("cookie:granted"));
    setVisible(false);
  }

  function deny() {
    localStorage.setItem("cookie_consent", "denied");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-4 shadow-lg sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-xl sm:border"
    >
      <p className="text-sm text-gray-700 leading-relaxed">
        We use cookies to improve your experience and for anonymous analytics.
        See our{" "}
        <a href="/privacy" className="underline hover:text-gray-900">
          Privacy Policy
        </a>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={grant}
          className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
        >
          Accept
        </button>
        <button
          onClick={deny}
          className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
