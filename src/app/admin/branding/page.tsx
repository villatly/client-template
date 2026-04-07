import { getBranding, getConfig } from "@/lib/property";
import BrandingForm from "@/components/admin/BrandingForm";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const [branding, config] = await Promise.all([
    getBranding(),
    getConfig(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Branding</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customize the visual identity of your website.
        </p>
      </div>
      <BrandingForm initial={branding} premiumLayouts={config.premiumLayouts ?? false} />
    </div>
  );
}
