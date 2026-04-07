import { getContent } from "@/lib/property";
import GalleryManager from "@/components/admin/GalleryManager";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const content = await getContent();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Gallery</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the photo gallery shown on your property page.
        </p>
      </div>
      <GalleryManager initial={content.gallery} />
    </div>
  );
}
