import Link from "next/link";
import { getContent } from "@/lib/property";
import DeleteRoomButton from "@/components/admin/DeleteRoomButton";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const content = await getContent();
  const rooms = [...content.rooms].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Rooms</h1>
          <p className="mt-1 text-sm text-gray-500">
            {rooms.length} accommodation unit{rooms.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/rooms/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          + Add Room
        </Link>
      </div>

      <div className="space-y-3">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            {room.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={room.image}
                alt={room.name}
                className="h-16 w-24 rounded object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{room.name}</h3>
                {room.isFeatured && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                    Featured
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                {room.capacity > 0 && <span>Up to {room.capacity} guests</span>}
                {room.bedType && <span>{room.bedType}</span>}
                {room.size && <span>{room.size}</span>}
                {room.priceFrom && (
                  <span className="font-medium text-gray-700">From {room.priceFrom}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400 truncate">{room.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/admin/rooms/${room.id}`}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Edit
              </Link>
              <DeleteRoomButton roomId={room.id} roomName={room.name} />
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-sm text-gray-400">No rooms yet.</p>
          <Link
            href="/admin/rooms/new"
            className="mt-3 inline-block text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Add your first room &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
