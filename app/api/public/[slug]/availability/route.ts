import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/public/:slug/availability?date=2026-08-01
// Returns open 30-minute slots for that business on that date, based on their
// weekly availability minus any appointments that already exist.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const dateParam = req.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json({ error: "date query param required, e.g. ?date=2026-08-01" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const date = new Date(dateParam + "T00:00:00");
  const dayOfWeek = date.getDay();

  const availability = await prisma.availability.findFirst({
    where: { businessId: business.id, dayOfWeek },
  });

  if (!availability) {
    return NextResponse.json({ slots: [] }); // business isn't open that day
  }

  // Build the day's working window as real Date objects
  const [startH, startM] = availability.startTime.split(":").map(Number);
  const [endH, endM] = availability.endTime.split(":").map(Number);
  const windowStart = new Date(date);
  windowStart.setHours(startH, startM, 0, 0);
  const windowEnd = new Date(date);
  windowEnd.setHours(endH, endM, 0, 0);

  // Existing appointments that day, so we can exclude overlapping slots
  const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const existing = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      status: { not: "cancelled" },
      startTime: { gte: date, lt: dayEnd },
    },
  });

  // Generate 30-minute candidate slots and filter out ones that overlap an existing appointment
  const SLOT_MINUTES = 30;
  const slots: string[] = [];
  let cursor = new Date(windowStart);

  while (cursor < windowEnd) {
    const slotEnd = new Date(cursor.getTime() + SLOT_MINUTES * 60 * 1000);
    const overlaps = existing.some((a) => cursor < a.endTime && slotEnd > a.startTime);
    const inPast = cursor < new Date();

    if (!overlaps && !inPast) {
      slots.push(cursor.toISOString());
    }
    cursor = slotEnd;
  }

  return NextResponse.json({ businessName: business.name, slots });
}