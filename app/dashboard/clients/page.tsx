"use client";

import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadClients() {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) {
      setClients(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: email || undefined, phone: phone || undefined }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't add client. Try again.");
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setShowForm(false);
    loadClients();
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Clients</h1>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
            {clients.length} client{clients.length === 1 ? "" : "s"}
          </p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} style={primaryButtonStyle}>
          {showForm ? "Cancel" : "Add client"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "#f9f9f8",
            border: "1px solid #e5e5e5",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />
          {error && <p style={{ color: "#c0392b", fontSize: 14, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={submitting} style={primaryButtonStyle}>
            {submitting ? "Saving…" : "Save client"}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>
      ) : clients.length === 0 ? (
        <p style={{ color: "#999", fontSize: 14 }}>No clients yet. Add your first one above.</p>
      ) : (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 8, overflow: "hidden" }}>
          {clients.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: i < clients.length - 1 ? "1px solid #eee" : "none",
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 14 }}>{c.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                  {c.email || "No email"} {c.phone ? `· ${c.phone}` : ""}
                </p>
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

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid #ccc",
  borderRadius: 6,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: 14,
  fontWeight: 500,
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};