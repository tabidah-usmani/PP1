import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export async function GET() {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await prisma.service.findMany({
    where: { businessId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const service = await prisma.service.create({ data: { ...parsed.data, businessId } });
  return NextResponse.json(service, { status: 201 });
}