import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";

const ALLOWED_STATUSES = ["unpaid", "paid", "overdue"];

// PATCH /api/invoices/:id — update status (e.g. mark paid)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.invoice.findFirst({ where: { id: params.id, businessId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  if (body.status && !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: { status: body.status ?? existing.status },
  });

  return NextResponse.json(updated);
}