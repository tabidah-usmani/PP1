"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = { id: string; name: string; email: string | null; phone: string | null };
type Service = { id: string; name: string; price: number };

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = client, 2 = service & time, 3 = confirm

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Step 1 state
  const [mode, setMode] = useState<"existing" | "new">("new");
  const [existingClientId, setExistingClientId] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Step 2 state
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState(toLocalInputValue(new Date()));
  const [duration, setDuration] = useState(60);

  // Flow control
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients").then(async (r) => r.ok && setClients(await r.json()));
    fetch("/api/services").then(async (r) => r.ok && setServices(await r.json()));
  }, []);

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedExistingClient = clients.find((c) => c.id === existingClientId);

  function goToStep2() {
    setError(null);
    if (mode === "existing" && !existingClientId) {
      setError("Select a client, or switch to \"New client\".");
      return;
    }
    if (mode === "new" && !newName.trim()) {
      setError("Enter the client's name.");
      return;
    }
    setStep(2);
  }

  function goToStep3() {
    setError(null);
    if (!serviceId) {
      setError("Select a service.");
      return;
    }
    setStep(3);
  }

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);

    try {
      // 1. Resolve the client — create if this is a new one
      let clientId = existingClientId;
      if (mode === "new") {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName, email: newEmail || undefined, phone: newPhone || undefined }),
        });
        if (!res.ok) throw new Error("Couldn't save the client.");
        const client = await res.json();
        clientId = client.id;
      }

      // 2. Book the appointment
      const startTime = new Date(start);
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      const apptRes = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          serviceName: selectedService!.name,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          price: selectedService!.price,
        }),
      });
      if (!apptRes.ok) {
        const data = await apptRes.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Couldn't book that time slot.");
      }
      const appointment = await apptRes.json();

      // 3. Generate the invoice immediately, tied to this appointment
      const invRes = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointment.id, clientId, amount: selectedService!.price }),
      });
      if (invRes.ok) {
        const invoice = await invRes.json();
        setCreatedInvoiceId(invoice.id);
      }

      setDone(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 480 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)" }}>Booking complete</h1>
        <p style={{ color: "#5c6b64", marginTop: 8, marginBottom: 24 }}>
          {(mode === "new" ? newName : selectedExistingClient?.name)} is booked for {selectedService?.name} on{" "}
          {new Date(start).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}, and an invoice for $
          {selectedService?.price} has been created.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push("/dashboard")} style={primaryButtonStyle}>Back to dashboard</button>
          {createdInvoiceId && (
            <a href={`/api/invoices/${createdInvoiceId}/pdf`} target="_blank" style={secondaryButtonStyle}>Download invoice PDF</a>
          )}
          <button
            onClick={() => {
              setStep(1);
              setDone(false);
              setMode("new");
              setNewName("");
              setNewEmail("");
              setNewPhone("");
              setServiceId("");
              setExistingClientId("");
            }}
            style={secondaryButtonStyle}
          >
            Book another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>New booking</h1>
      <p style={{ color: "#5c6b64", marginBottom: 24, fontSize: 14 }}>Client → service &amp; time → confirm, all in one go.</p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["Client", "Service & time", "Confirm"].map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600,
                background: step > i + 1 ? "var(--ink)" : step === i + 1 ? "var(--amber)" : "#E4DDCC",
                color: step >= i + 1 ? (step === i + 1 ? "var(--ink)" : "#fff") : "#999",
              }}
            >
              {i + 1}
            </div>
            <span style={{ fontSize: 13, color: step === i + 1 ? "var(--ink)" : "#999" }}>{label}</span>
            {i < 2 && <span style={{ color: "#D7D0C0", margin: "0 4px" }}>—</span>}
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        {step === 1 && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button onClick={() => setMode("new")} style={mode === "new" ? tabActiveStyle : tabStyle}>New client</button>
              <button onClick={() => setMode("existing")} style={mode === "existing" ? tabActiveStyle : tabStyle}>Existing client</button>
            </div>

            {mode === "new" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input type="text" placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
                <input type="email" placeholder="Email (optional)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
                <input type="tel" placeholder="Phone (optional)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} style={inputStyle} />
              </div>
            ) : (
              <select value={existingClientId} onChange={(e) => setExistingClientId(e.target.value)} style={inputStyle}>
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {error && <p style={{ color: "#B65C3D", fontSize: 14, marginTop: 12 }}>{error}</p>}

            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={goToStep2} style={primaryButtonStyle}>Next: Service &amp; time →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {services.length === 0 ? (
              <p style={{ color: "#B65C3D", fontSize: 14 }}>
                No services set up yet. <a href="/dashboard/services" style={{ color: "#B65C3D" }}>Add one first →</a>
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={inputStyle}>
                  <option value="">Select a service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>
                  ))}
                </select>
                <label style={{ fontSize: 13, color: "#5c6b64" }}>Date &amp; time</label>
                <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={inputStyle} />
                <label style={{ fontSize: 13, color: "#5c6b64" }}>Duration (minutes)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={15} step={15} style={inputStyle} />
              </div>
            )}

            {error && <p style={{ color: "#B65C3D", fontSize: 14, marginTop: 12 }}>{error}</p>}

            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(1)} style={secondaryButtonStyle}>← Back</button>
              <button onClick={goToStep3} style={primaryButtonStyle}>Next: Confirm →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "var(--ink)" }}>
              <SummaryRow label="Client" value={mode === "new" ? newName : selectedExistingClient?.name || ""} />
              <SummaryRow label="Service" value={`${selectedService?.name} — $${selectedService?.price}`} />
              <SummaryRow label="When" value={new Date(start).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} />
              <SummaryRow label="Duration" value={`${duration} min`} />
            </div>
            <p style={{ fontSize: 13, color: "#5c6b64", marginTop: 14 }}>
              Confirming will book the appointment and create an unpaid invoice for ${selectedService?.price} automatically.
            </p>

            {error && <p style={{ color: "#B65C3D", fontSize: 14, marginTop: 12 }}>{error}</p>}

            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(2)} style={secondaryButtonStyle}>← Back</button>
              <button onClick={handleConfirm} disabled={submitting} style={primaryButtonStyle}>
                {submitting ? "Booking…" : "Confirm booking"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", paddingBottom: 8 }}>
      <span style={{ color: "#5c6b64" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "10px 12px", fontSize: 14, border: "1px solid #D7D0C0", borderRadius: 6, background: "#fff", color: "var(--ink)", width: "100%" };
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #E4DDCC", borderRadius: 10, padding: 20 };
const primaryButtonStyle: React.CSSProperties = { padding: "10px 18px", fontSize: 14, fontWeight: 600, background: "var(--amber)", color: "var(--ink)", border: "none", borderRadius: 6, cursor: "pointer" };
const secondaryButtonStyle: React.CSSProperties = { padding: "10px 18px", fontSize: 14, background: "#fff", color: "var(--ink)", border: "1px solid #D7D0C0", borderRadius: 6, cursor: "pointer", textDecoration: "none", display: "inline-block" };
const tabStyle: React.CSSProperties = { padding: "6px 14px", fontSize: 13, background: "#fff", color: "#5c6b64", border: "1px solid #D7D0C0", borderRadius: 6, cursor: "pointer" };
const tabActiveStyle: React.CSSProperties = { ...tabStyle, background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" };