"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

interface AnalyticsProps {
  gaId?: string;
}

/**
 * GA4 analytics loader — consent-gated.
 *
 * Only loads the Google Analytics script after the user grants cookie consent
 * via the CookieConsent component. Listens for both:
 *   - localStorage "cookie_consent" already set to "granted" on mount
 *   - a custom "cookie:granted" event dispatched by CookieConsent on acceptance
 *
 * If NEXT_PUBLIC_GA_ID is not set, this component renders nothing.
 */
export default function Analytics({ gaId }: AnalyticsProps) {
  useEffect(() => {
    if (!gaId) return;

    function loadGA() {
      // Idempotent — don't inject twice
      if (document.querySelector(`script[src*="googletagmanager"]`)) return;

      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function (...args: unknown[]) {
        window.dataLayer.push(args);
      };
      window.gtag("js", new Date());
      window.gtag("config", gaId, { anonymize_ip: true });
    }

    // Already consented in a previous session
    if (localStorage.getItem("cookie_consent") === "granted") {
      loadGA();
      return;
    }

    // Wait for consent to be granted in this session
    const handleConsent = () => loadGA();
    window.addEventListener("cookie:granted", handleConsent);
    return () => window.removeEventListener("cookie:granted", handleConsent);
  }, [gaId]);

  return null;
}
