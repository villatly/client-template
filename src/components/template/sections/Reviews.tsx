import SectionWrapper from "@/components/template/ui/SectionWrapper";
import StarRating from "@/components/template/ui/StarRating";
import Reveal from "@/components/template/ui/Reveal";
import type { Review } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface ReviewsProps {
  reviews: Review[];
  layout?: LayoutPreset;
  bgColor?: string;
}

export default function Reviews({ reviews, layout = "default", bgColor }: ReviewsProps) {
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  // ─── Editorial ─────────────────────────────────────────────────────────────
  // No card boxes. Text-first. Each review is a typographic row with
  // author attribution left and the review text right. Reads like a
  // curated magazine letters section.

  if (layout === "editorial") {
    return (
      <section id="reviews" className="bg-white py-24 md:py-32 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-4xl">

          <Reveal className="mb-14">
            <div className="border-l-4 border-primary pl-7">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/70">
                Guest Reviews
              </p>
              <h2 className="text-4xl font-light text-text sm:text-5xl">What Our Guests Say</h2>
              <p className="mt-3 text-sm text-text-muted">
                Rated {avgRating} / 5 · {reviews.length} reviews
              </p>
            </div>
          </Reveal>

          {/* Reviews — no card boxes, just text + dividers */}
          <div className="divide-y divide-border">
            {reviews.map((review, i) => (
              <div key={i} className="py-10 grid gap-6 md:grid-cols-[1fr_3fr]">

                {/* Left: author attribution */}
                <div className="flex flex-row md:flex-col md:pt-2 gap-4 md:gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text leading-tight">{review.author}</p>
                    {review.country && (
                      <p className="text-xs text-text-muted mt-0.5">{review.country}</p>
                    )}
                    <div className="mt-2">
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                </div>

                {/* Right: the review text, prominent */}
                <div className="relative">
                  <span
                    className="absolute -top-3 -left-1 select-none text-6xl font-serif leading-none text-primary/10"
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>
                  <blockquote className="pt-4 text-lg font-light italic leading-relaxed text-text-secondary">
                    {review.text}
                  </blockquote>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>
    );
  }

  // ─── Resort ────────────────────────────────────────────────────────────────
  // Dark background. Frosted glass cards stagger-reveal as they scroll into view.

  if (layout === "resort") {
    return (
      <section id="reviews" className="bg-gray-950 py-24 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
              Guest Reviews
            </p>
            <h2 className="text-3xl font-light text-white sm:text-4xl">What Our Guests Say</h2>
            <p className="mt-4 text-sm text-white/40">
              Rated {avgRating} / 5 from {reviews.length} reviews
            </p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2">
            {reviews.map((review, i) => (
              <Reveal key={i} delay={i * 80} variant="fade">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm h-full">
                  <StarRating rating={review.rating} />
                  <blockquote className="mt-4 text-base leading-relaxed text-white/70 italic">
                    &ldquo;{review.text}&rdquo;
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white/60">
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{review.author}</p>
                      {review.country && (
                        <p className="text-xs text-white/40">{review.country}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ─── Default ───────────────────────────────────────────────────────────────

  return (
    <SectionWrapper id="reviews" background="white" style={bgColor ? { backgroundColor: bgColor } : undefined}>
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Guest Reviews
        </p>
        <h2 className="text-3xl sm:text-4xl text-text">What Our Guests Say</h2>
        <p className="mt-4 text-lg text-text-secondary">
          Rated {avgRating} / 5 from {reviews.length} reviews
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {reviews.map((review, i) => (
          <div key={i} className="rounded-lg border border-border bg-white p-6 shadow-sm">
            <StarRating rating={review.rating} />
            <blockquote className="mt-4 text-base leading-relaxed text-text-secondary italic">
              &ldquo;{review.text}&rdquo;
            </blockquote>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {review.author.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-text">{review.author}</p>
                {review.country && (
                  <p className="text-xs text-text-muted">{review.country}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
