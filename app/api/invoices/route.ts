import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";

const createSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: z.string().datetime().optional(),
});

// GET /api/invoices?status=unpaid — list invoices, optionally filtered by status
export async function GET(req: NextRequest) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");

  const invoices = await prisma.invoice.findMany({
    where: { businessId, ...(status ? { status } : {}) },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

// POST /api/invoices — create an invoice, usually from a completed appointment
export async function POST(req: NextRequest) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { appointmentId, clientId, amount, dueDate } = parsed.data;

  const client = await prisma.client.findFirst({ where: { id: clientId, businessId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const invoice = await prisma.invoice.create({
    data: {
      businessId,
      clientId,
      appointmentId,
      amount,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}