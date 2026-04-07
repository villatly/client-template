import { NextResponse } from "next/server";
import { getSections, writeSections } from "@/lib/property";
import type { SectionVisibility } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getSections());
}

export async function PUT(request: Request) {
  const body = await request.json() as SectionVisibility;
  await writeSections(body);
  return NextResponse.json(body);
}
