import { redirect } from "next/navigation";
import { getCurrentBusinessId } from "@/lib/auth";
import { prisma } from "@/lib/db";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function DashboardPage() {
  const businessId = getCurrentBusinessId();
  if (!businessId) redirect("/login");

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) redirect("/login");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todaysAppointments, unpaidInvoices, paidThisMonth, totalClients] = await Promise.all([
    prisma.appointment.findMany({
      where: { businessId, startTime: { gte: startOfToday, lt: endOfToday }, status: { not: "cancelled" } },
      include: { client: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.invoice.findMany({
      where: { businessId, status: { in: ["unpaid", "overdue"] } },
      include: { client: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.invoice.aggregate({
      where: { businessId, status: "paid", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.client.count({ where: { businessId } }),
  ]);

  const revenueThisMonth = paidThisMonth._sum.amount ?? 0;

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Welcome back</h1>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>{business.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>
            Your booking link: <a href={`/book/${business.slug}`} target="_blank" style={{ color: "#0c447c" }}>
              {typeof window !== "undefined" ? window.location.origin : ""}/book/{business.slug}
            </a>
          </p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" style={buttonStyle}>Log out</button>
        </form>
      </div>

      <nav style={{ display: "flex", gap: 16, marginBottom: 24, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
        <a href="/dashboard/clients" style={navLinkStyle}>Clients</a>
        <a href="/dashboard/appointments" style={navLinkStyle}>Appointments</a>
        <a href="/dashboard/invoices" style={navLinkStyle}>Invoices</a>
        <a href="/dashboard/availability" style={navLinkStyle}>Availability</a>
      </nav>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        <MetricCard label="Today's appointments" value={todaysAppointments.length} />
        <MetricCard label="Unpaid invoices" value={unpaidInvoices.length} />
        <MetricCard label="Revenue this month" value={formatMoney(revenueThisMonth)} />
        <MetricCard label="Total clients" value={totalClients} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Today's schedule</h2>
          {todaysAppointments.length === 0 ? (
            <p style={emptyStyle}>No appointments scheduled today.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {todaysAppointments.map((a) => (
                <div key={a.id} style={rowStyle}>
                  <span style={{ fontSize: 13, color: "#666", width: 64 }}>{formatTime(a.startTime)}</span>
                  <div style={avatarStyle}>{initials(a.client.name)}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14 }}>{a.client.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#666" }}>{a.serviceName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Unpaid invoices</h2>
          {unpaidInvoices.length === 0 ? (
            <p style={emptyStyle}>Nothing outstanding.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {unpaidInvoices.map((inv) => (
                <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14 }}>{inv.client.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: inv.status === "overdue" ? "#c0392b" : "#666" }}>
                      {inv.status === "overdue" ? "Overdue" : inv.dueDate ? `Due ${inv.dueDate.toLocaleDateString()}` : "No due date"}
                    </p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: inv.status === "overdue" ? "#c0392b" : "#111" }}>
                    {formatMoney(inv.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#f5f5f4", borderRadius: 8, padding: "1rem" }}>
      <p style={{ margin: "0 0 4px", fontSize: 13, color: "#666" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 500 }}>{value}</p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: 12,
  padding: "1rem 1.25rem",
};

const cardTitleStyle: React.CSSProperties = { fontSize: 15, fontWeight: 500, margin: "0 0 12px" };
const emptyStyle: React.CSSProperties = { fontSize: 13, color: "#999", margin: 0 };
const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid #eee" };
const avatarStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: "#e6f1fb",
  color: "#0c447c",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 500,
};
const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 14,
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};
const navLinkStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#111",
  textDecoration: "none",
  fontWeight: 500,
};