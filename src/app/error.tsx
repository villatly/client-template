"use client";

// error.tsx must be a Client Component — it receives the error and reset function
// from Next.js which are injected at runtime, not available server-side.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service here if you add one (e.g. Sentry)
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Error</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Something went wrong</h1>
      <p className="text-gray-500 max-w-sm mb-8">
        An unexpected error occurred. Please try again — if the problem persists,
        contact the property directly.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Go home
        </a>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-gray-300">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
