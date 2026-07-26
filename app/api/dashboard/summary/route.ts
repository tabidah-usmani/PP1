import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";
export async function GET() {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [todaysAppointments, unpaidInvoices, paidThisMonth, totalClients] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: startOfToday, lt: endOfToday },
        status: { not: "cancelled" },
      },
      include: { client: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.invoice.findMany({
      where: { businessId, status: { in: ["unpaid", "overdue"] } },
      include: { client: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.invoice.aggregate({
      where: {
        businessId,
        status: "paid",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.client.count({ where: { businessId } }),
  ]);
  return NextResponse.json({
    todaysAppointments: todaysAppointments.map((a) => ({
      id: a.id,
      clientName: a.client.name,
      serviceName: a.serviceName,
      startTime: a.startTime,
    })),
    unpaidInvoices: unpaidInvoices.map((i) => ({
      id: i.id,
      clientName: i.client.name,
      amount: i.amount,
      status: i.status,
      dueDate: i.dueDate,
    })),
    revenueThisMonth: paidThisMonth._sum.amount ?? 0,
    totalClients,
  });
}