import { NextResponse } from "next/server";
import { getContent, writeContent } from "@/lib/property";
import type { HeroContent } from "@/lib/types";

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content.hero);
}

export async function PUT(request: Request) {
  const body = await request.json() as HeroContent;
  const content = await getContent();
  content.hero = body;
  await writeContent(content);
  return NextResponse.json(content.hero);
}
