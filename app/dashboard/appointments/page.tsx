"use client";

import { useEffect, useState } from "react";

type Client = { id: string; name: string };
type Appointment = {
  id: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number | null;
  client: { name: string };
};

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AppointmentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [clientId, setClientId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [start, setStart] = useState(toLocalInputValue(new Date()));
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const [clientsRes, apptsRes] = await Promise.all([
      fetch("/api/clients"),
      fetch("/api/appointments"),
    ]);
    if (clientsRes.ok) setClients(await clientsRes.json());
    if (apptsRes.ok) setAppointments(await apptsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const startTime = new Date(start);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        serviceName,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        price: price ? Number(price) : undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't book appointment.");
      return;
    }

    setServiceName("");
    setPrice("");
    setShowForm(false);
    loadData();
  }

  async function markCompleted(id: string) {
    setActioningId(id);
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setActioningId(null);
    loadData();
  }

  async function generateInvoice(appt: Appointment) {
    if (!appt.price) {
      alert("This appointment has no price set — edit it to add one before invoicing.");
      return;
    }
    setActioningId(appt.id);
    const clientMatch = clients.find((c) => c.name === appt.client.name);
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: appt.id,
        clientId: clientMatch?.id,
        amount: appt.price,
      }),
    });
    setActioningId(null);
    alert("Invoice created. View it on the Invoices page.");
  }

  return (
    <main style={{ maxWidth: 750, margin: "40px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Appointments</h1>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>Upcoming week</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} style={primaryButtonStyle} disabled={clients.length === 0}>
          {showForm ? "Cancel" : "Book appointment"}
        </button>
      </div>

      {clients.length === 0 && (
        <p style={{ color: "#c0392b", fontSize: 14 }}>
          Add a client first before booking an appointment. <a href="/dashboard/clients">Go to clients →</a>
        </p>
      )}

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
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required style={inputStyle}>
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Service (e.g. Haircut)"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
            style={inputStyle}
          />
          <label style={{ fontSize: 13, color: "#666" }}>Start time</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            style={inputStyle}
          />
          <label style={{ fontSize: 13, color: "#666" }}>Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={15}
            step={15}
            style={inputStyle}
          />
          <label style={{ fontSize: 13, color: "#666" }}>Price (optional, needed to invoice later)</label>
          <input
            type="number"
            placeholder="e.g. 85"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
            step="0.01"
            style={inputStyle}
          />
          {error && <p style={{ color: "#c0392b", fontSize: 14, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={submitting} style={primaryButtonStyle}>
            {submitting ? "Booking…" : "Book appointment"}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>
      ) : appointments.length === 0 ? (
        <p style={{ color: "#999", fontSize: 14 }}>No appointments booked yet.</p>
      ) : (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 8, overflow: "hidden" }}>
          {appointments.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: i < appointments.length - 1 ? "1px solid #eee" : "none",
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 14 }}>
                  {a.client.name} — {a.serviceName} {a.price ? `($${a.price})` : ""}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                  {new Date(a.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · {a.status}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {a.status === "scheduled" && (
                  <button
                    onClick={() => markCompleted(a.id)}
                    disabled={actioningId === a.id}
                    style={secondaryButtonStyle}
                  >
                    Mark completed
                  </button>
                )}
                {a.status === "completed" && (
                  <button
                    onClick={() => generateInvoice(a)}
                    disabled={actioningId === a.id}
                    style={secondaryButtonStyle}
                  >
                    Generate invoice
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

const secondaryButtonStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 13,
  background: "#fff",
  color: "#111",
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
};