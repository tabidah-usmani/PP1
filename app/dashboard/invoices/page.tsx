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
    <div>
      <h1 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>Invoices</h1>
      <p style={{ margin: "4px 0 20px", color: "#5c6b64", fontSize: 14 }}>
        Generate invoices from completed appointments on the Appointments page.
      </p>

      {loading ? (
        <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>
      ) : invoices.length === 0 ? (
        <p style={{ color: "#999", fontSize: 14 }}>No invoices yet.</p>
      ) : (
        <div style={listCardStyle}>
          {invoices.map((inv, i) => (
            <div key={inv.id} style={{ ...rowStyle, borderBottom: i < invoices.length - 1 ? "1px solid #eee" : "none" }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>{inv.client.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: inv.status === "paid" ? "#3F6B4A" : "#5c6b64" }}>{inv.status}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="font-mono" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>${inv.amount}</span>
                {inv.status !== "paid" && (
                  <button onClick={() => markPaid(inv.id)} disabled={actioningId === inv.id} style={secondaryButtonStyle}>
                    Mark paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const secondaryButtonStyle: React.CSSProperties = { padding: "6px 12px", fontSize: 13, background: "#fff", color: "var(--ink)", border: "1px solid #D7D0C0", borderRadius: 6, cursor: "pointer" };
const listCardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #E4DDCC", borderRadius: 8, overflow: "hidden" };
const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" };