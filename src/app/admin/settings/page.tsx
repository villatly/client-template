import { getConfig } from "@/lib/property";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = await getConfig();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your notification email, property name used in emails, and timezone.
        </p>
      </div>

      <SettingsForm initial={config} />
    </div>
  );
}
