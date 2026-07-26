import { redirect } from "next/navigation";
import { getCurrentBusinessId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const businessId = getCurrentBusinessId();
  if (!businessId) redirect("/login");

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) redirect("/login");

  return (
    <main style={{ maxWidth: 600, margin: "80px auto", padding: "0 16px" }}>
      <h1>Welcome, {business.name}</h1>
      <p style={{ color: "#666" }}>
        This is a placeholder — the real dashboard (today's appointments, unpaid invoices,
        revenue) gets built next.
      </p>
      <form action="/api/auth/logout" method="post" style={{ marginTop: 24 }}>
        <button
          type="submit"
          style={{
            padding: "8px 12px",
            fontSize: 14,
            border: "1px solid #ccc",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </form>
    </main>
  );
}