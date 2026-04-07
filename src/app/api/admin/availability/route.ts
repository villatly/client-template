import { NextResponse } from "next/server";
import { getAvailability, writeAvailability } from "@/lib/property";
import type { AvailabilityData } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getAvailability());
}

export async function PUT(request: Request) {
  const body = await request.json() as AvailabilityData;
  await writeAvailability(body);
  return NextResponse.json(body);
}
