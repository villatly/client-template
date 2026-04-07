import { NextResponse } from "next/server";
import { getContent, writeContent } from "@/lib/property";
import type { PropertyContent } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getContent());
}

// PUT { section: keyof PropertyContent, data: unknown }
export async function PUT(request: Request) {
  const body = await request.json() as { section: keyof PropertyContent; data: unknown };
  const content = await getContent();
  (content as unknown as Record<string, unknown>)[body.section] = body.data;
  await writeContent(content);
  return NextResponse.json({ ok: true });
}
