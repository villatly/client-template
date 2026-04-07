"use client";

import { useState } from "react";
import Button from "@/components/template/ui/Button";
import type { ContactInfo, BrandingConfig, BookingConfig } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";
import AvailabilityWidget from "@/components/template/AvailabilityWidget";

interface BookingCTAProps {
  contact: ContactInfo;
  branding: BrandingConfig;
  propertyName: string;
  booking: BookingConfig;
  layout?: LayoutPreset;
}

export default function BookingCTA({ contact, branding, propertyName, booking, layout }: BookingCTAProps) {
  const [widgetOpen, setWidgetOpen] = useState(false);

  const barClass = layout === "default" || !layout
    ? "bg-primary py-5"
    : "bg-gray-950 py-5 border-b border-white/5";

  return (
    <>
      <section className={barClass}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-white/90 tracking-wide">
            Ready to experience {propertyName}?
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setWidgetOpen(true)}
              variant="secondary"
              buttonStyle={branding.buttonStyle}
            >
              {booking.ctaLabel || "Check Availability"}
            </Button>
            {contact.whatsapp && (
              <Button
                href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                variant="outline"
                buttonStyle={branding.buttonStyle}
                className="border-white/50 text-white hover:bg-white/10"
              >
                WhatsApp
              </Button>
            )}
          </div>
        </div>
      </section>

      {widgetOpen && (
        <AvailabilityWidget config={booking} onClose={() => setWidgetOpen(false)} />
      )}
    </>
  );
}
