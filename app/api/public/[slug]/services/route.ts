import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const services = await prisma.service.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(services);
}