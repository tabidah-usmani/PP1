import { getCurrentBusinessId } from "@/lib/auth";
import { prisma } from "@/lib/db";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default async function DashboardPage() {
  const businessId = getCurrentBusinessId()!; // layout already guarantees this exists
  const business = await prisma.business.findUnique({ where: { id: businessId } });

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
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "var(--ink)" }}>
          Welcome back
        </h1>
        <p style={{ margin: "4px 0 0", color: "#5c6b64", fontSize: 14 }}>{business?.name}</p>
        <p style={{ margin: "6px 0 0", fontSize: 13 }}>
          Booking link:{" "}
          <a href={`/book/${business?.slug}`} target="_blank" className="font-mono" style={{ color: "#B65C3D" }}>
            /book/{business?.slug}
          </a>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <MetricCard label="Today's appointments" value={todaysAppointments.length} />
        <MetricCard label="Unpaid invoices" value={unpaidInvoices.length} />
        <MetricCard label="Revenue this month" value={formatMoney(revenueThisMonth)} />
        <MetricCard label="Total clients" value={totalClients} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <div style={cardStyle}>
          <h2 className="font-display" style={cardTitleStyle}>Today's schedule</h2>
          {todaysAppointments.length === 0 ? (
            <p style={emptyStyle}>No appointments scheduled today.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {todaysAppointments.map((a) => (
                <div key={a.id} style={rowStyle}>
                  <span className="font-mono" style={{ fontSize: 12.5, color: "#5c6b64", width: 68 }}>{formatTime(a.startTime)}</span>
                  <div style={avatarStyle}>{initials(a.client.name)}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>{a.client.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#5c6b64" }}>{a.serviceName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 className="font-display" style={cardTitleStyle}>Unpaid invoices</h2>
          {unpaidInvoices.length === 0 ? (
            <p style={emptyStyle}>Nothing outstanding.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {unpaidInvoices.map((inv) => (
                <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>{inv.client.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: inv.status === "overdue" ? "#B65C3D" : "#5c6b64" }}>
                      {inv.status === "overdue" ? "Overdue" : inv.dueDate ? `Due ${inv.dueDate.toLocaleDateString()}` : "No due date"}
                    </p>
                  </div>
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 500, color: inv.status === "overdue" ? "#B65C3D" : "var(--ink)" }}>
                    {formatMoney(inv.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4DDCC", borderRadius: 8, padding: "1rem" }}>
      <p style={{ margin: "0 0 4px", fontSize: 13, color: "#5c6b64" }}>{label}</p>
      <p className="font-display" style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "var(--ink)" }}>{value}</p>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #E4DDCC", borderRadius: 12, padding: "1rem 1.25rem" };
const cardTitleStyle: React.CSSProperties = { fontSize: 16, fontWeight: 600, margin: "0 0 12px", color: "var(--ink)" };
const emptyStyle: React.CSSProperties = { fontSize: 13, color: "#999", margin: 0 };
const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid #eee" };
const avatarStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: "50%", background: "#F1ECE1", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 };