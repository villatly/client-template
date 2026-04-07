"use client";

import { useState } from "react";
import SectionWrapper from "@/components/template/ui/SectionWrapper";
import type { FAQItem } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface FAQProps {
  items: FAQItem[];
  layout?: LayoutPreset;
}

export default function FAQ({ items, layout }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // ── Editorial variant ────────────────────────────────────────────────
  if (layout === "editorial") {
    return (
      <section id="faq" className="bg-white py-24 md:py-32 px-4">
        <div className="mx-auto max-w-4xl">

          <div className="mb-16 border-l-4 border-primary pl-7">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/70">FAQ</p>
            <h2 className="text-4xl font-light text-text sm:text-5xl">Common Questions</h2>
          </div>

          <div className="space-y-0">
            {items.map((item, i) => {
              const isOpen = openIndex === i;
              const num = String(i + 1).padStart(2, "0");
              return (
                <div key={i} className="border-b border-border/60">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-start gap-8 py-8 text-left group"
                  >
                    {/* Large typographic number */}
                    <span className="shrink-0 text-4xl font-light leading-none text-primary/20 tabular-nums pt-0.5">
                      {num}
                    </span>
                    <span className="flex-1 text-base font-medium text-text group-hover:text-primary transition-colors leading-snug">
                      {item.question}
                    </span>
                    <svg
                      className={`mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-96 pb-8" : "max-h-0"}`}>
                    <p className="ml-[5.5rem] text-sm leading-relaxed text-text-secondary">
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    );
  }

  // ── Resort variant ───────────────────────────────────────────────────
  if (layout === "resort") {
    return (
      <section id="faq" className="bg-gray-950 py-24 md:py-32 px-4">
        <div className="mx-auto max-w-3xl">

          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">FAQ</p>
            <h2 className="text-3xl font-light text-white sm:text-4xl">Common Questions</h2>
          </div>

          <div className="divide-y divide-white/10">
            {items.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between py-5 text-left"
                  >
                    <span className="pr-6 text-sm font-light text-white/80">
                      {item.question}
                    </span>
                    <span className="shrink-0 text-lg font-light text-white/40 w-5 text-center">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-96 pb-6" : "max-h-0"}`}>
                    <p className="text-sm leading-relaxed text-white/50">
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    );
  }

  // ── Default variant ──────────────────────────────────────────────────
  return (
    <SectionWrapper id="faq" background="surface">
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          FAQ
        </p>
        <h2 className="text-3xl sm:text-4xl text-text">Common Questions</h2>
      </div>

      <div className="mx-auto max-w-3xl divide-y divide-border">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between py-5 text-left"
              >
                <span className="pr-4 text-base font-medium text-text">
                  {item.question}
                </span>
                <svg
                  className={`h-5 w-5 shrink-0 text-text-muted transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? "max-h-96 pb-5" : "max-h-0"
                }`}
              >
                <p className="text-sm leading-relaxed text-text-secondary">
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
