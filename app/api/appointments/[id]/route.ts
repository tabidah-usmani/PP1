import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";

const ALLOWED_STATUSES = ["scheduled", "completed", "cancelled"];

// PATCH /api/appointments/:id — update status (e.g. mark completed or cancelled)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.appointment.findFirst({ where: { id: params.id, businessId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  if (body.status && !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      status: body.status ?? existing.status,
      serviceName: body.serviceName ?? existing.serviceName,
      price: body.price ?? existing.price,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/appointments/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.appointment.findFirst({ where: { id: params.id, businessId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.appointment.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}