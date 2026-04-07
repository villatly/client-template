/**
 * GET /api/admin/bookings — list all bookings (admin only)
 * Returns full booking records sorted newest-first.
 */

import { NextResponse } from "next/server";
import { getBookings } from "@/lib/bookings";

export async function GET() {
  const bookings = (await getBookings()).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );
  return NextResponse.json({ bookings });
}
