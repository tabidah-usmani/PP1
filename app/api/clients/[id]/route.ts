import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";

// GET /api/clients/:id — client detail plus appointment/invoice history
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findFirst({
    where: { id: params.id, businessId },
    include: {
      appointments: { orderBy: { startTime: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

// PATCH /api/clients/:id — update client fields
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const existing = await prisma.client.findFirst({ where: { id: params.id, businessId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: body.name ?? existing.name,
      email: body.email ?? existing.email,
      phone: body.phone ?? existing.phone,
      notes: body.notes ?? existing.notes,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/clients/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.client.findFirst({ where: { id: params.id, businessId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
