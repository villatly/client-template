import { NextResponse } from "next/server";
import { getBranding, writeBranding } from "@/lib/property";
import type { BrandingConfig } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getBranding());
}

export async function PUT(request: Request) {
  const body = await request.json() as BrandingConfig;
  await writeBranding(body);
  return NextResponse.json(body);
}
