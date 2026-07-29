"use client";

import { useEffect, useState } from "react";

type Service = { id: string; name: string; price: number };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadServices() {
    setLoading(true);
    const res = await fetch("/api/services");
    if (res.ok) setServices(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price: Number(price) }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't add service.");
      return;
    }

    setName("");
    setPrice("");
    setShowForm(false);
    loadServices();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this service?")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    loadServices();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>Services</h1>
          <p style={{ margin: "4px 0 0", color: "#5c6b64", fontSize: 14 }}>
            Clients pick from this list when they book themselves online.
          </p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} style={primaryButtonStyle}>
          {showForm ? "Cancel" : "Add service"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formCardStyle}>
          <input type="text" placeholder="Service name (e.g. Haircut)" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required min={0} step="0.01" style={inputStyle} />
          {error && <p style={{ color: "#B65C3D", fontSize: 14, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={submitting} style={primaryButtonStyle}>
            {submitting ? "Saving…" : "Save service"}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>
      ) : services.length === 0 ? (
        <p style={{ color: "#999", fontSize: 14 }}>
          No services yet. Add at least one so clients can book themselves online.
        </p>
      ) : (
        <div style={listCardStyle}>
          {services.map((s, i) => (
            <div key={s.id} style={{ ...rowStyle, borderBottom: i < services.length - 1 ? "1px solid #eee" : "none" }}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>{s.name}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span className="font-mono" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>${s.price}</span>
                <button onClick={() => handleDelete(s.id)} style={deleteButtonStyle}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "10px 12px", fontSize: 14, border: "1px solid #D7D0C0", borderRadius: 6, background: "#fff", color: "var(--ink)" };
const primaryButtonStyle: React.CSSProperties = { padding: "9px 16px", fontSize: 14, fontWeight: 600, background: "var(--amber)", color: "var(--ink)", border: "none", borderRadius: 6, cursor: "pointer" };
const deleteButtonStyle: React.CSSProperties = { padding: "4px 10px", fontSize: 12, background: "transparent", color: "#B65C3D", border: "1px solid #B65C3D", borderRadius: 6, cursor: "pointer" };
const formCardStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 10, background: "#fff", border: "1px solid #E4DDCC", borderRadius: 8, padding: 16, marginBottom: 20 };
const listCardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #E4DDCC", borderRadius: 8, overflow: "hidden" };
const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" };