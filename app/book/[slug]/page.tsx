"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [slots, setSlots] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function loadSlots() {
    setLoadingSlots(true);
    setSelectedSlot(null);
    const res = await fetch(`/api/public/${slug}/availability?date=${date}`);
    if (res.status === 404) {
      setNotFound(true);
      setLoadingSlots(false);
      return;
    }
    const data = await res.json();
    setBusinessName(data.businessName || "");
    setSlots(data.slots || []);
    setLoadingSlots(false);
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, slug]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/public/${slug}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        clientEmail,
        clientPhone: clientPhone || undefined,
        serviceName,
        startTime: selectedSlot,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't book that slot. Try another.");
      loadSlots();
      return;
    }

    setSuccess(true);
  }

  if (notFound) {
    return (
      <main style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
        <h1>Booking page not found</h1>
        <p style={{ color: "#666" }}>Double check the link you were given.</p>
      </main>
    );
  }

  if (success) {
    return (
      <main style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 16px" }}>
        <h1>You're booked!</h1>
        <p style={{ color: "#666" }}>
          {serviceName} with {businessName} on{" "}
          {selectedSlot && new Date(selectedSlot).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}.
        </p>
        <p style={{ color: "#666", fontSize: 14 }}>A confirmation was noted under {clientEmail}.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "60px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 4 }}>Book with {businessName || "…"}</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>Pick a date and open time slot.</p>

      <input
        type="date"
        value={date}
        min={toDateInputValue(new Date())}
        onChange={(e) => setDate(e.target.value)}
        style={{ ...inputStyle, marginBottom: 16 }}
      />

      {loadingSlots ? (
        <p style={{ color: "#999", fontSize: 14 }}>Loading available times…</p>
      ) : slots.length === 0 ? (
        <p style={{ color: "#999", fontSize: 14 }}>No open slots this day. Try another date.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8, marginBottom: 20 }}>
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              style={{
                ...slotButtonStyle,
                background: selectedSlot === slot ? "#111" : "#fff",
                color: selectedSlot === slot ? "#fff" : "#111",
              }}
            >
              {new Date(slot).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </button>
          ))}
        </div>
      )}

      {selectedSlot && (
        <form onSubmit={handleBook} style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <input
            type="text"
            placeholder="Service (e.g. Haircut)"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Your name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Your email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            style={inputStyle}
          />
          {error && <p style={{ color: "#c0392b", fontSize: 14, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={submitting} style={primaryButtonStyle}>
            {submitting ? "Booking…" : `Confirm ${new Date(selectedSlot).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
          </button>
        </form>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid #ccc",
  borderRadius: 6,
};

const slotButtonStyle: React.CSSProperties = {
  padding: "8px 6px",
  fontSize: 13,
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  fontWeight: 500,
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};