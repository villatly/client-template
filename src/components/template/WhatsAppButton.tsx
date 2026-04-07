"use client";

interface WhatsAppButtonProps {
  number: string;
  propertyName: string;
}

/**
 * Floating WhatsApp CTA — fixed bottom-right on the public website.
 * Only renders if a valid WhatsApp number is provided.
 *
 * The number should include the country code without spaces or dashes
 * (e.g. "+62 812 3456 7890" → normalised to "628123456789").
 */
export default function WhatsAppButton({ number, propertyName }: WhatsAppButtonProps) {
  // Normalise: strip everything except digits and leading +
  const normalised = number.replace(/[^\d]/g, "");
  if (!normalised) return null;

  const message = encodeURIComponent(
    `Hi! I'm interested in booking at ${propertyName}. Could you help me?`
  );
  const href = `https://wa.me/${normalised}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
    >
      {/* WhatsApp icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.106 1.51 5.84L.057 23.852a.5.5 0 00.61.61l6.098-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892a9.875 9.875 0 01-5.048-1.383l-.362-.215-3.75.89.905-3.654-.234-.375A9.869 9.869 0 012.108 12C2.108 6.527 6.527 2.108 12 2.108S21.892 6.527 21.892 12 17.473 21.892 12 21.892z" />
      </svg>
    </a>
  );
}
