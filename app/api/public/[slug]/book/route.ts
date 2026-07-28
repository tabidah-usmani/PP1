import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const bookSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  serviceName: z.string().min(1),
  startTime: z.string().datetime(),
});

// POST /api/public/:slug/book — client self-books an appointment, no auth required
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await req.json();
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { clientName, clientEmail, clientPhone, serviceName } = parsed.data;
  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // fixed 30-min slots for now

  // Same overlap check as the authenticated booking route — protects against a race
  // where two people book the same slot at nearly the same time.
  const conflict = await prisma.appointment.findFirst({
    where: {
      businessId: business.id,
      status: { not: "cancelled" },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "That slot was just taken. Please pick another." }, { status: 409 });
  }

  // Find or create the client by email, scoped to this business
  let client = await prisma.client.findFirst({
    where: { businessId: business.id, email: clientEmail },
  });
  if (!client) {
    client = await prisma.client.create({
      data: { businessId: business.id, name: clientName, email: clientEmail, phone: clientPhone },
    });
  }

  const appointment = await prisma.appointment.create({
    data: { businessId: business.id, clientId: client.id, serviceName, startTime, endTime },
  });

  return NextResponse.json({ success: true, appointment }, { status: 201 });
}