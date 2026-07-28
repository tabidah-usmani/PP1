"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  amount: number;
  status: string;
  dueDate: string | null;
  client: { name: string };
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function loadInvoices() {
    setLoading(true);
    const res = await fetch("/api/invoices");
    if (res.ok) setInvoices(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function markPaid(id: string) {
    setActioningId(id);
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    setActioningId(null);
    loadInvoices();
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Invoices</h1>
      <p style={{ margin: "4px 0 20px", color: "#666", fontSize: 14 }}>
        Generate invoices from completed appointments on the Appointments page.
      </p>

      {loading ? (
        <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>
      ) : invoices.length === 0 ? (
        <p style={{ color: "#999", fontSize: 14 }}>No invoices yet.</p>
      ) : (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 8, overflow: "hidden" }}>
          {invoices.map((inv, i) => (
            <div
              key={inv.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: i < invoices.length - 1 ? "1px solid #eee" : "none",
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 14 }}>{inv.client.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: inv.status === "paid" ? "#2e7d32" : "#666" }}>
                  {inv.status}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>${inv.amount}</span>
                {inv.status !== "paid" && (
                  <button
                    onClick={() => markPaid(inv.id)}
                    disabled={actioningId === inv.id}
                    style={secondaryButtonStyle}
                  >
                    Mark paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: 20 }}>
        <a href="/dashboard" style={{ fontSize: 14 }}>← Back to dashboard</a>
      </p>
    </main>
  );
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 13,
  background: "#fff",
  color: "#111",
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
};