import type { PropertyContent, BrandingConfig, SectionVisibility, BookingConfig } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";
import { getBrandingCSSVars, getFontClass } from "@/lib/theme";

import Hero from "@/components/template/sections/Hero";
import BookingCTA from "@/components/template/sections/BookingCTA";
import About from "@/components/template/sections/About";
import Gallery from "@/components/template/sections/Gallery";
import Rooms from "@/components/template/sections/Rooms";
import Amenities from "@/components/template/sections/Amenities";
import Reviews from "@/components/template/sections/Reviews";
import FAQ from "@/components/template/sections/FAQ";
import Location from "@/components/template/sections/Location";
import NearbyAttractions from "@/components/template/sections/NearbyAttractions";
import Policies from "@/components/template/sections/Policies";
import ContactCTA from "@/components/template/sections/ContactCTA";
import Footer from "@/components/template/sections/Footer";
import WhatsAppButton from "@/components/template/WhatsAppButton";

interface PropertyPageProps {
  property: {
    content: PropertyContent;
    branding: BrandingConfig;
    sections: SectionVisibility;
    booking: BookingConfig;
  };
}

export default function PropertyPage({ property }: PropertyPageProps) {
  const { content, branding, sections, booking } = property;
  const fontClass = getFontClass(branding.fontStyle);
  const layout: LayoutPreset = branding.layoutPreset ?? "default";

  return (
    <div style={getBrandingCSSVars(branding)} className={fontClass}>
      {sections.hero && (
        <Hero
            content={content.hero}
            branding={branding}
            booking={booking}
            layout={layout}
            identity={content.identity}
            amenities={content.amenities}
            showBookingBar={sections.bookingCta && layout === "default"}
            contact={content.contact}
            propertyName={content.identity.name}
          />
      )}

      {sections.bookingCta && layout !== "default" && (
        <BookingCTA
          contact={content.contact}
          branding={branding}
          propertyName={content.identity.name}
          booking={booking}
          layout={layout}
          bgColor={branding.sectionColors?.bookingCta}
        />
      )}

      {sections.about && (
        <About description={content.description} identity={content.identity} layout={layout} bgColor={branding.sectionColors?.about} />
      )}

      {sections.gallery && (
        <Gallery items={content.gallery} layout={layout} bgColor={branding.sectionColors?.gallery} />
      )}

      {sections.rooms && (
        <Rooms rooms={content.rooms} propertyType={content.identity.propertyType} booking={booking} contact={content.contact} layout={layout} bgColor={branding.sectionColors?.rooms} />
      )}

      {sections.amenities && (
        <Amenities amenities={content.amenities} layout={layout} bgColor={branding.sectionColors?.amenities} />
      )}

      {sections.reviews && (
        <Reviews reviews={content.reviews} layout={layout} bgColor={branding.sectionColors?.reviews} />
      )}

      {sections.faq && (
        <FAQ items={content.faq} layout={layout} bgColor={branding.sectionColors?.faq} />
      )}

      {sections.location && (
        <Location location={content.location} layout={layout} bgColor={branding.sectionColors?.location} />
      )}

      {sections.nearbyAttractions && (
        <NearbyAttractions attractions={content.nearbyAttractions} layout={layout} bgColor={branding.sectionColors?.nearbyAttractions} />
      )}

      {sections.policies && (
        <Policies policies={content.policies} layout={layout} bgColor={branding.sectionColors?.policies} />
      )}

      {sections.contactCta && (
        <ContactCTA
          contact={content.contact}
          branding={branding}
          propertyName={content.identity.name}
          layout={layout}
          bgColor={branding.sectionColors?.contactCta}
        />
      )}

      {sections.footer && (
        <Footer identity={content.identity} contact={content.contact} layout={layout} bgColor={branding.sectionColors?.footer} />
      )}

      {/* Floating WhatsApp button — only renders if a number is configured */}
      {booking.bookingWhatsapp && (
        <WhatsAppButton
          number={booking.bookingWhatsapp}
          propertyName={content.identity.name}
        />
      )}
    </div>
  );
}
