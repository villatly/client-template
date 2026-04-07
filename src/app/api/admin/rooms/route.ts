import { NextResponse } from "next/server";
import { getContent, writeContent } from "@/lib/property";
import type { RoomUnit } from "@/lib/types";

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content.rooms);
}

export async function POST(request: Request) {
  const body = await request.json() as RoomUnit;
  const content = await getContent();

  const maxOrder = content.rooms.reduce((m, r) => Math.max(m, r.displayOrder ?? 0), -1);
  const newRoom: RoomUnit = {
    ...body,
    id: body.id || `room-${Date.now()}`,
    displayOrder: body.displayOrder ?? maxOrder + 1,
  };

  content.rooms.push(newRoom);
  await writeContent(content);
  return NextResponse.json(newRoom, { status: 201 });
}
