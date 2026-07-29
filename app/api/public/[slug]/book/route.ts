import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const bookSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
});

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await req.json();
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { clientName, clientEmail, clientPhone, serviceId } = parsed.data;
  const startTime = new Date(parsed.data.startTime);

  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId: business.id } });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // fixed 30-min slots for now

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

  let client = await prisma.client.findFirst({ where: { businessId: business.id, email: clientEmail } });
  if (!client) {
    client = await prisma.client.create({
      data: { businessId: business.id, name: clientName, email: clientEmail, phone: clientPhone },
    });
  }

  // Create the appointment and its invoice together, atomically
  const [appointment, invoice] = await prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.create({
      data: {
        businessId: business.id,
        clientId: client!.id,
        serviceName: service.name,
        startTime,
        endTime,
        price: service.price,
      },
    });
    const inv = await tx.invoice.create({
      data: {
        businessId: business.id,
        clientId: client!.id,
        appointmentId: appt.id,
        amount: service.price,
        dueDate: startTime,
      },
    });
    return [appt, inv];
  });

  return NextResponse.json({ success: true, appointment, invoice }, { status: 201 });
}