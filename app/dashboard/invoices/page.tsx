"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  amount: number;
  amountPaid: number;
  status: string;
  dueDate: string | null;
  client: { name: string };
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadInvoices() {
    setLoading(true);
    const res = await fetch("/api/invoices");
    if (res.ok) setInvoices(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  function openPaymentForm(inv: Invoice) {
    setPayingId(inv.id);
    setPaymentAmount("");
  }

  async function submitPayment(inv: Invoice) {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;

    setSubmitting(true);
    await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountReceived: amount }),
    });
    setSubmitting(false);
    setPayingId(null);
    loadInvoices();
  }

  return (
    <div>
      <h1 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>Invoices</h1>
      <p style={{ margin: "4px 0 20px", color: "#5c6b64", fontSize: 14 }}>
        Invoices from public bookings appear here automatically. Generate others from completed appointments.
      </p>

      {loading ? (
        <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>
      ) : invoices.length === 0 ? (
        <p style={{ color: "#999", fontSize: 14 }}>No invoices yet.</p>
      ) : (
        <div style={listCardStyle}>
          {invoices.map((inv, i) => {
            const remaining = Math.max(0, inv.amount - inv.amountPaid);
            const previewRemaining = payingId === inv.id && paymentAmount
              ? Math.max(0, remaining - Number(paymentAmount))
              : remaining;

            return (
              <div key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? "1px solid #eee" : "none", padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>{inv.client.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: inv.status === "paid" ? "#3F6B4A" : inv.status === "partial" ? "#B58A2E" : "#5c6b64" }}>
                      {inv.status === "paid" ? "Paid in full" : inv.status === "partial" ? `Partially paid — $${remaining.toFixed(2)} remaining` : "Unpaid"}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="font-mono" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                      ${inv.amount.toFixed(2)}
                    </span>
                    <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" style={secondaryButtonStyle}>
                      PDF
                    </a>
                    {inv.status !== "paid" && payingId !== inv.id && (
                      <button onClick={() => openPaymentForm(inv)} style={primaryButtonSmallStyle}>
                        Record payment
                      </button>
                    )}
                  </div>
                </div>

                {payingId === inv.id && (
                  <div style={{ marginTop: 10, background: "#FAF7F0", border: "1px solid #E4DDCC", borderRadius: 6, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="number"
                      placeholder="Cash received"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min={0}
                      step="0.01"
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 13, color: "#5c6b64", whiteSpace: "nowrap" }}>
                      Remaining after: <strong className="font-mono" style={{ color: "var(--ink)" }}>${previewRemaining.toFixed(2)}</strong>
                    </span>
                    <button onClick={() => submitPayment(inv)} disabled={submitting} style={primaryButtonSmallStyle}>
                      {submitting ? "Saving…" : "Confirm"}
                    </button>
                    <button onClick={() => setPayingId(null)} style={secondaryButtonStyle}>Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "8px 10px", fontSize: 14, border: "1px solid #D7D0C0", borderRadius: 6, background: "#fff", color: "var(--ink)", width: 120 };
const secondaryButtonStyle: React.CSSProperties = { padding: "6px 12px", fontSize: 13, background: "#fff", color: "var(--ink)", border: "1px solid #D7D0C0", borderRadius: 6, cursor: "pointer", textDecoration: "none" };
const primaryButtonSmallStyle: React.CSSProperties = { padding: "6px 12px", fontSize: 13, fontWeight: 600, background: "var(--amber)", color: "var(--ink)", border: "none", borderRadius: 6, cursor: "pointer" };
const listCardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #E4DDCC", borderRadius: 8, overflow: "hidden" };