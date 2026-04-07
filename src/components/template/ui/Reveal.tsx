"use client";

import { useInView } from "@/lib/motion";

interface RevealProps {
  children: React.ReactNode;
  /** Additional Tailwind classes on the wrapper div */
  className?: string;
  /** Stagger offset in ms — use to sequence sibling reveals */
  delay?: number;
  /**
   * "up"   — fades in while translating up 20px (default, good for text blocks)
   * "fade" — fades in in-place (good for images or wide elements)
   */
  variant?: "up" | "fade";
}

/**
 * Wraps children in a div that is invisible until it enters the viewport,
 * then transitions to fully visible. Server components can safely import
 * this — it acts as the client boundary.
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>();

  const base = "transition-all duration-700 ease-out";
  const hidden = variant === "up" ? "opacity-0 translate-y-5" : "opacity-0";
  const visible = "opacity-100 translate-y-0";

  return (
    <div
      ref={ref}
      className={`${base} ${inView ? visible : hidden} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
