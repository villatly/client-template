import { NextResponse } from "next/server";
import { getAvailability, getContent } from "@/lib/property";
import { calculatePrice, countAvailableUnits } from "@/lib/pricing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkIn  = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  if (!checkIn || !checkOut || checkIn >= checkOut) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const [availability, content] = await Promise.all([
    getAvailability(),
    getContent(),
  ]);

  const results = content.rooms.map((room) => {
    const roomAvail = availability[room.id];

    if (!roomAvail) {
      return {
        room,
        available:         true,
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
    const available      = availableUnits > 0;
    const priceCalc      = calculatePrice(roomAvail, checkIn, checkOut);

    return {
      room,
      available,
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

  return NextResponse.json({ checkIn, checkOut, results });
}
