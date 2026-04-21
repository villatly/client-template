import { NextResponse } from "next/server";
import { getAvailability, getContent } from "@/lib/property";
import { calculatePrice, countAvailableUnits } from "@/lib/pricing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkIn  = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests   = Math.max(1, parseInt(searchParams.get("guests") ?? "1", 10) || 1);

  if (!checkIn || !checkOut || checkIn >= checkOut) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const [availability, content] = await Promise.all([
    getAvailability(),
    getContent(),
  ]);

  const results = content.rooms.map((room) => {
    const roomAvail = availability[room.id];

    // Capacity check — a room is over capacity if it has a defined capacity
    // smaller than the requested guest count.
    const capacityExceeded =
      room.capacity != null && room.capacity > 0 && guests > room.capacity;

    if (!roomAvail) {
      return {
        room,
        available:         !capacityExceeded,
        capacityExceeded,
        availableUnits:    1,
        totalUnits:        1,
        pricePerNight:     null,
        avgPricePerNight:  null,
        minStay:           1,
        nights:            0,
        totalPrice:        null,
        priceBreakdown:    [],
      };
    }

    const availableUnits = countAvailableUnits(roomAvail.units, checkIn, checkOut);
    const totalUnits     = roomAvail.units.length;
    const datesAvailable = availableUnits > 0;
    // A room is bookable only when both dates and capacity are OK.
    const available      = datesAvailable && !capacityExceeded;
    const priceCalc      = calculatePrice(roomAvail, checkIn, checkOut);

    return {
      room,
      available,
      capacityExceeded,
      availableUnits,
      totalUnits,
      pricePerNight:     roomAvail.pricePerNight,
      avgPricePerNight:  priceCalc.avgPricePerNight,
      minStay:           roomAvail.minStay,
      nights:            priceCalc.totalNights,
      totalPrice:        available ? priceCalc.totalPrice : null,
      priceBreakdown:    available ? priceCalc.breakdown : [],
    };
  });

  return NextResponse.json({ checkIn, checkOut, guests, results });
}
