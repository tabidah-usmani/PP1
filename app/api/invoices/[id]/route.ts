import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";

const patchSchema = z.object({
  amountReceived: z.number().positive().optional(), // record a cash/manual payment
  status: z.enum(["unpaid", "partial", "paid", "overdue"]).optional(), // direct status override
});

// PATCH /api/invoices/:id
// Either pass { amountReceived } to record a payment (balance is calculated automatically),
// or { status } to force a status directly (e.g. marking overdue).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.invoice.findFirst({ where: { id: params.id, businessId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let amountPaid = existing.amountPaid;
  let status = existing.status;

  if (parsed.data.amountReceived !== undefined) {
    amountPaid = Math.min(existing.amount, existing.amountPaid + parsed.data.amountReceived);
    status = amountPaid >= existing.amount ? "paid" : amountPaid > 0 ? "partial" : "unpaid";
  } else if (parsed.data.status) {
    status = parsed.data.status;
    if (status === "paid") amountPaid = existing.amount;
  }

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: { amountPaid, status },
  });

  return NextResponse.json({
    ...updated,
    remainingBalance: Math.max(0, updated.amount - updated.amountPaid),
  });
}