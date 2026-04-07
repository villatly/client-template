import RoomForm from "@/components/admin/RoomForm";

export default function NewRoomPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Add New Room</h1>
        <p className="mt-1 text-sm text-gray-500">Create a new accommodation unit</p>
      </div>
      <RoomForm isNew={true} />
    </div>
  );
}
