import { NextResponse } from "next/server";
import { getContent, writeContent } from "@/lib/property";
import type { GalleryItem } from "@/lib/types";

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content.gallery);
}

export async function PUT(request: Request) {
  const body = await request.json() as GalleryItem[];
  const content = await getContent();
  content.gallery = body;
  await writeContent(content);
  return NextResponse.json(content.gallery);
}
