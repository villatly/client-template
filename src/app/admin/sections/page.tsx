import { getSections } from "@/lib/property";
import SectionsForm from "@/components/admin/SectionsForm";

export const dynamic = "force-dynamic";

export default async function SectionsPage() {
  const sections = await getSections();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Section Visibility</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enable or disable page sections. Section order is fixed.
        </p>
      </div>
      <SectionsForm initial={sections} />
    </div>
  );
}
