import { notFound } from "next/navigation";
import { getContent } from "@/lib/property";
import RoomForm from "@/components/admin/RoomForm";

export const dynamic = "force-dynamic";

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const content = await getContent();
  const room = content.rooms.find((r) => r.id === id);

  if (!room) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit Room</h1>
        <p className="mt-1 text-sm text-gray-500">{room.name}</p>
      </div>
      <RoomForm initial={room} isNew={false} />
    </div>
  );
}
