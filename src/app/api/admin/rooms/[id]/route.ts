import { NextResponse } from "next/server";
import { getContent, writeContent } from "@/lib/property";
import type { RoomUnit } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const content = await getContent();
  const room = content.rooms.find((r) => r.id === id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(room);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json() as RoomUnit;
  const content = await getContent();

  const idx = content.rooms.findIndex((r) => r.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  content.rooms[idx] = { ...body, id };
  await writeContent(content);
  return NextResponse.json(content.rooms[idx]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const content = await getContent();

  const idx = content.rooms.findIndex((r) => r.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  content.rooms.splice(idx, 1);
  // re-index displayOrder
  content.rooms.forEach((r, i) => { r.displayOrder = i; });
  await writeContent(content);
  return NextResponse.json({ ok: true });
}
