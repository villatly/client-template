import { NextResponse } from "next/server";
import { getConfig, writeConfig } from "@/lib/property";
import type { PropertyConfig } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getConfig());
}

export async function PUT(request: Request) {
  const body = await request.json() as Partial<PropertyConfig>;

  // Read current config and merge — never allow a partial PUT to wipe fields
  const current = await getConfig();
  const updated: PropertyConfig = {
    ...current,
    // Only allow updating safe, user-editable fields
    name:          body.name?.trim()          || current.name,
    adminEmail:    body.adminEmail?.trim()     || current.adminEmail,
    timezone:      body.timezone?.trim()       || current.timezone,
    defaultLocale: body.defaultLocale?.trim()  || current.defaultLocale,
    premiumLayouts: body.premiumLayouts ?? current.premiumLayouts,
  };

  if (updated.adminEmail && !updated.adminEmail.includes("@")) {
    return NextResponse.json({ error: "Invalid admin email address" }, { status: 400 });
  }

  await writeConfig(updated);
  return NextResponse.json(updated);
}
