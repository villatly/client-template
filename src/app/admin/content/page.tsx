import { getContent } from "@/lib/property";
import Accordion from "@/components/admin/Accordion";
import HeroForm from "@/components/admin/HeroForm";
import DescriptionForm from "@/components/admin/DescriptionForm";
import AmenitiesEditor from "@/components/admin/AmenitiesEditor";
import ReviewsEditor from "@/components/admin/ReviewsEditor";
import FAQEditor from "@/components/admin/FAQEditor";
import LocationForm from "@/components/admin/LocationForm";
import NearbyEditor from "@/components/admin/NearbyEditor";
import PoliciesForm from "@/components/admin/PoliciesForm";
import ContactForm from "@/components/admin/ContactForm";
import SEOForm from "@/components/admin/SEOForm";
import IdentityForm from "@/components/admin/IdentityForm";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const content = await getContent();

  const sections = [
    { id: "identity", label: "Property Info", sub: content.identity.name, form: <IdentityForm initial={content.identity} /> },
    { id: "hero", label: "Hero Section", sub: content.hero.headline, form: <HeroForm initial={content.hero} /> },
    { id: "description", label: "About / Description", sub: content.description.short.slice(0, 80) + "…", form: <DescriptionForm initial={content.description} /> },
    { id: "amenities", label: `Amenities (${content.amenities.length})`, sub: content.amenities.slice(0, 3).map(a => a.label).join(", "), form: <AmenitiesEditor initial={content.amenities} /> },
    { id: "reviews", label: `Guest Reviews (${content.reviews.length})`, sub: `Avg ${(content.reviews.reduce((s, r) => s + r.rating, 0) / (content.reviews.length || 1)).toFixed(1)} / 5`, form: <ReviewsEditor initial={content.reviews} /> },
    { id: "faq", label: `FAQ (${content.faq.length} items)`, sub: content.faq[0]?.question ?? "", form: <FAQEditor initial={content.faq} /> },
    { id: "location", label: "Location", sub: content.location.areaName, form: <LocationForm initial={content.location} /> },
    { id: "nearby", label: `Nearby Attractions (${content.nearbyAttractions.length})`, sub: content.nearbyAttractions.map(a => a.name).join(", "), form: <NearbyEditor initial={content.nearbyAttractions} /> },
    { id: "policies", label: "Policies", sub: `Check-in ${content.policies.checkIn} · Check-out ${content.policies.checkOut}`, form: <PoliciesForm initial={content.policies} /> },
    { id: "contact", label: "Contact & Booking Links", sub: content.contact.email ?? content.contact.whatsapp ?? "", form: <ContactForm initial={content.contact} /> },
    { id: "seo", label: "SEO & Social", sub: content.seo.title, form: <SEOForm initial={content.seo} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Content</h1>
        <p className="mt-1 text-sm text-gray-500">
          Edit your property information, descriptions, and guest-facing content.
        </p>
      </div>

      <Accordion sections={sections} />
    </div>
  );
}
