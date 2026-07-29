import { redirect } from "next/navigation";
import { getCurrentBusinessId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const businessId = getCurrentBusinessId();
  if (!businessId) redirect("/login");

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <header style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <a href="/dashboard" className="font-display" style={{ fontSize: 18, fontWeight: 600, color: "var(--paper)", textDecoration: "none" }}>
            Ledger
          </a>
          <nav style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/dashboard/clients" style={navLinkStyle}>Clients</a>
            <a href="/dashboard/services" style={navLinkStyle}>Services</a>
            <a href="/dashboard/appointments" style={navLinkStyle}>Appointments</a>
            <a href="/dashboard/invoices" style={navLinkStyle}>Invoices</a>
            <a href="/dashboard/availability" style={navLinkStyle}>Availability</a>
            <a href="/dashboard/new-booking" style={{ ...navLinkStyle, background: "var(--amber)", color: "var(--ink)", padding: "6px 12px", borderRadius: 6, fontWeight: 600, opacity: 1 }}>
              + New booking
            </a>
            <form action="/api/auth/logout" method="post">
              <button type="submit" style={logoutButtonStyle}>Log out</button>
            </form>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>{children}</main>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = { fontSize: 14, color: "var(--paper)", opacity: 0.85, textDecoration: "none" };
const logoutButtonStyle: React.CSSProperties = { padding: "6px 12px", fontSize: 13, border: "1px solid rgba(241,236,225,0.3)", borderRadius: 6, background: "transparent", color: "var(--paper)", cursor: "pointer" };