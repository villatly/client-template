import { NextResponse } from "next/server";
import { getAvailability, getBooking } from "@/lib/property";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [booking, availability] = await Promise.all([
    getBooking(),
    getAvailability(),
  ]);

  // Calendar data is available for both instant_book and request_to_book modes
  if (!booking.mode) {
    return NextResponse.json({ error: "Booking not configured" }, { status: 400 });
  }

  const roomData = availability[id];

  if (!roomData) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({
    pricePerNight: roomData.pricePerNight,
    minStay:       roomData.minStay,
    pricePeriods:  roomData.pricePeriods ?? [],
    units:         roomData.units,
  });
}
