"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ServiceOption = { id: string; name: string; price: number };

function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [slots, setSlots] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/public/${slug}/services`).then(async (r) => {
      if (r.ok) setServices(await r.json());
    });
  }, [slug]);

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

  const selectedService = services.find((s) => s.id === serviceId);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !serviceId) return;
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/public/${slug}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        clientEmail,
        clientPhone: clientPhone || undefined,
        serviceId,
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
      <main style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", background: "var(--paper)" }}>
        <h1 className="font-display">Booking page not found</h1>
        <p style={{ color: "#5c6b64" }}>Double check the link you were given.</p>
      </main>
    );
  }

  if (success) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 460, textAlign: "center", padding: "0 16px" }}>
          <h1 className="font-display" style={{ fontSize: 28, color: "var(--ink)" }}>You're booked!</h1>
          <p style={{ color: "#5c6b64", marginTop: 8 }}>
            {selectedService?.name} with {businessName} on{" "}
            {selectedSlot && new Date(selectedSlot).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}.
          </p>
          <p style={{ color: "#5c6b64", fontSize: 14, marginTop: 12 }}>
            A confirmation was noted under {clientEmail}. An invoice for ${selectedService?.price} has been created —
            {businessName} will collect payment at your visit.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)", padding: "60px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
          Book with {businessName || "…"}
        </h1>
        <p style={{ color: "#5c6b64", marginBottom: 20, fontSize: 14.5 }}>Pick a service, date, and open time.</p>

        {services.length === 0 ? (
          <p style={{ color: "#B65C3D", fontSize: 14 }}>This business hasn't listed any services yet.</p>
        ) : (
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
            <option value="">Select a service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>
            ))}
          </select>
        )}

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
                  background: selectedSlot === slot ? "var(--ink)" : "#fff",
                  color: selectedSlot === slot ? "#fff" : "var(--ink)",
                }}
              >
                {new Date(slot).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </button>
            ))}
          </div>
        )}

        {selectedSlot && serviceId && (
          <form onSubmit={handleBook} style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #E4DDCC", paddingTop: 16 }}>
            <input type="text" placeholder="Your name" value={clientName} onChange={(e) => setClientName(e.target.value)} required style={inputStyle} />
            <input type="email" placeholder="Your email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required style={inputStyle} />
            <input type="tel" placeholder="Phone (optional)" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} style={inputStyle} />
            {error && <p style={{ color: "#B65C3D", fontSize: 14, margin: 0 }}>{error}</p>}
            <button type="submit" disabled={submitting} style={primaryButtonStyle}>
              {submitting
                ? "Booking…"
                : `Confirm ${new Date(selectedSlot).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} — $${selectedService?.price}`}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = { padding: "10px 12px", fontSize: 14, border: "1px solid #D7D0C0", borderRadius: 6, background: "#fff", color: "var(--ink)", width: "100%" };
const slotButtonStyle: React.CSSProperties = { padding: "8px 6px", fontSize: 13, border: "1px solid #D7D0C0", borderRadius: 6, cursor: "pointer" };
const primaryButtonStyle: React.CSSProperties = { padding: "10px 12px", fontSize: 14, fontWeight: 600, background: "var(--amber)", color: "var(--ink)", border: "none", borderRadius: 6, cursor: "pointer" };