import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";

const createSchema = z.object({
  clientId: z.string().uuid(),
  serviceName: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  price: z.number().optional(),
});

// GET /api/appointments?from=ISO&to=ISO — list appointments in a range (defaults to next 7 days)
export async function GET(req: NextRequest) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date();
  const to = searchParams.get("to")
    ? new Date(searchParams.get("to")!)
    : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId,
      startTime: { gte: from, lte: to },
    },
    include: { client: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(appointments);
}

// POST /api/appointments — book a new appointment, rejecting overlaps
export async function POST(req: NextRequest) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { clientId, serviceName, price } = parsed.data;
  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(parsed.data.endTime);

  if (endTime <= startTime) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({ where: { id: clientId, businessId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const conflict = await prisma.appointment.findFirst({
    where: {
      businessId,
      status: { not: "cancelled" },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "This time slot overlaps with an existing appointment" },
      { status: 409 }
    );
  }

  const appointment = await prisma.appointment.create({
    data: { businessId, clientId, serviceName, startTime, endTime, price },
  });

  return NextResponse.json(appointment, { status: 201 });
}