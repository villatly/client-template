import { NextResponse } from "next/server";
import { getBooking, writeBooking } from "@/lib/property";
import type { BookingConfig } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getBooking());
}

export async function PUT(request: Request) {
  const body = await request.json() as BookingConfig;
  // Validate mode is one of the supported values
  if (body.mode !== "instant_book" && body.mode !== "request_to_book") {
    return NextResponse.json({ error: "Invalid booking mode" }, { status: 400 });
  }
  await writeBooking(body);
  return NextResponse.json(body);
}
