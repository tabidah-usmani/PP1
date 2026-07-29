import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.service.findFirst({ where: { id: params.id, businessId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.service.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}