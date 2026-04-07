import Link from "next/link";
import { getProperty } from "@/lib/property";
import { getBrandingCSSVars, getFontClass } from "@/lib/theme";

export default async function NotFound() {
  // Best-effort — if property data fails to load, render unstyled fallback
  let cssVars: React.CSSProperties = {};
  let fontClass = "";
  let propertyName = "the property";

  try {
    const property = await getProperty();
    cssVars = getBrandingCSSVars(property.branding);
    fontClass = getFontClass(property.branding.fontStyle);
    propertyName = property.content.identity.name;
  } catch {
    // Render unstyled — don't let a config error break the 404 page
  }

  return (
    <div style={cssVars} className={`${fontClass} min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center`}>
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">404</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-500 max-w-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Back to {propertyName}
        </Link>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Admin
        </Link>
      </div>
    </div>
  );
}
