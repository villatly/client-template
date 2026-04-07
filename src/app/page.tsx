import type { Metadata } from "next";
import { getProperty } from "@/lib/property";

export const dynamic = "force-dynamic";
import PropertyPage from "@/components/template/PropertyPage";

export async function generateMetadata(): Promise<Metadata> {
  const property = await getProperty();
  const { seo } = property.content;
  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [{ url: seo.ogImage }] : [],
    },
  };
}

export default async function HomePage() {
  const property = await getProperty();
  const { content, config } = property;
  const baseUrl = (process.env.NEXT_PUBLIC_URL ?? "").replace(/\/$/, "");

  // ── Schema.org JSON-LD (LodgingBusiness) ──────────────────────────────
  const schema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: content.identity.name,
    description: content.description.short,
    url: baseUrl || undefined,
    image: content.hero.image || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: content.location.areaName || config.location,
      addressCountry: config.country,
    },
    ...(content.contact.email && { email: content.contact.email }),
    ...(content.contact.phone && { telephone: content.contact.phone }),
    ...(content.reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (
          content.reviews.reduce((sum, r) => sum + r.rating, 0) /
          content.reviews.length
        ).toFixed(1),
        reviewCount: content.reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    amenityFeature: content.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a.label,
      value: true,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PropertyPage property={property} />
    </>
  );
}
