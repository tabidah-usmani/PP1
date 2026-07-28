import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";

const daySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // "09:00"
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const putSchema = z.array(daySchema);

// GET /api/availability — current weekly hours
export async function GET() {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const availability = await prisma.availability.findMany({
    where: { businessId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json(availability);
}

// PUT /api/availability — replace the full weekly schedule
export async function PUT(req: NextRequest) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Simplest correct approach: wipe and recreate. Fine at this scale (a handful of rows).
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { businessId } }),
    prisma.availability.createMany({
      data: parsed.data.map((d) => ({ ...d, businessId })),
    }),
  ]);

  const updated = await prisma.availability.findMany({
    where: { businessId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json(updated);
}