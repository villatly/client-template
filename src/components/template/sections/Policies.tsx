import SectionWrapper from "@/components/template/ui/SectionWrapper";
import type { PoliciesContent } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface PoliciesProps {
  policies: PoliciesContent;
  layout?: LayoutPreset;
  bgColor?: string;
}

export default function Policies({ policies, layout, bgColor }: PoliciesProps) {
  if (layout === "editorial") {
    return (
      <section id="policies" className="bg-white py-24 md:py-32 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-4xl">

          <div className="mb-14 border-l-4 border-primary pl-7">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/70">
              Stay Info
            </p>
            <h2 className="text-4xl font-light text-text sm:text-5xl">Good to Know</h2>
          </div>

          {/* Three policy items as typographic list */}
          <div className="mb-10 grid gap-0 sm:grid-cols-3">
            {[
              { label: "Check-in", value: policies.checkIn },
              { label: "Check-out", value: policies.checkOut },
              { label: "Cancellation", value: policies.cancellation },
            ].map((item, i) => (
              <div key={i} className="border-b border-border/60 py-7 sm:border-b-0 sm:border-r sm:pr-8 sm:pl-8 first:sm:pl-0 last:sm:border-r-0">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/60">
                  {item.label}
                </p>
                <p className="text-base text-text">{item.value}</p>
              </div>
            ))}
          </div>

          {policies.notes.length > 0 && (
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-text-muted">Notes</p>
              <ul className="space-y-3">
                {policies.notes.map((note, i) => (
                  <li key={i} className="flex gap-4 text-sm text-text-secondary">
                    <span className="shrink-0 text-primary/40 mt-px">—</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </section>
    );
  }

  if (layout === "resort") {
    return (
      <section id="policies" className="bg-gray-950 py-24 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-3xl">

          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Stay Info</p>
            <h2 className="text-3xl font-light text-white sm:text-4xl">Good to Know</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Check-in</p>
              <p className="mt-2 text-lg font-light text-white/80">{policies.checkIn}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Check-out</p>
              <p className="mt-2 text-lg font-light text-white/80">{policies.checkOut}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Cancellation</p>
              <p className="mt-2 text-sm text-white/60">{policies.cancellation}</p>
            </div>
          </div>

          {policies.notes.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-white/40">Stay Notes</p>
              <ul className="space-y-3">
                {policies.notes.map((note, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white/50">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </section>
    );
  }

  return (
    <SectionWrapper id="policies" background="surface" style={bgColor ? { backgroundColor: bgColor } : undefined}>
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Stay Info
        </p>
        <h2 className="text-3xl sm:text-4xl text-text">Good to Know</h2>
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Check-in
            </p>
            <p className="mt-2 text-lg font-medium text-text">{policies.checkIn}</p>
          </div>
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Check-out
            </p>
            <p className="mt-2 text-lg font-medium text-text">{policies.checkOut}</p>
          </div>
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Cancellation
            </p>
            <p className="mt-2 text-sm text-text-secondary">{policies.cancellation}</p>
          </div>
        </div>

        {policies.notes.length > 0 && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-medium text-text">Stay Notes</h3>
            <ul className="space-y-2">
              {policies.notes.map((note, i) => (
                <li key={i} className="flex gap-3 text-sm text-text-secondary">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
