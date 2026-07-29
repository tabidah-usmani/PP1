"use client";

import { useEffect, useState } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DaySetting = { enabled: boolean; startTime: string; endTime: string };

export default function AvailabilityPage() {
  const [days, setDays] = useState<DaySetting[]>(
    DAYS.map((_, i) => ({ enabled: i >= 1 && i <= 5, startTime: "09:00", endTime: "17:00" }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/availability")
      .then((r) => r.json())
      .then((rows: { dayOfWeek: number; startTime: string; endTime: string }[]) => {
        if (rows.length > 0) {
          setDays((prev) =>
            prev.map((d, i) => {
              const match = rows.find((r) => r.dayOfWeek === i);
              return match ? { enabled: true, startTime: match.startTime, endTime: match.endTime } : { ...d, enabled: false };
            })
          );
        }
        setLoading(false);
      });
  }, []);

  function updateDay(index: number, patch: Partial<DaySetting>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  async function handleSave() {
    setSaving(true);
    setSavedMessage(null);

    const payload = days
      .map((d, i) => ({ dayOfWeek: i, startTime: d.startTime, endTime: d.endTime, enabled: d.enabled }))
      .filter((d) => d.enabled)
      .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));

    await fetch("/api/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setSavedMessage("Saved!");
    setTimeout(() => setSavedMessage(null), 2000);
  }

  if (loading) return <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>Weekly availability</h1>
      <p style={{ margin: "4px 0 20px", color: "#5c6b64", fontSize: 14 }}>
        Set the hours clients can book you on your public booking page.
      </p>

      <div style={{ background: "#fff", border: "1px solid #E4DDCC", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {DAYS.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, width: 110, fontSize: 14, color: "var(--ink)" }}>
              <input type="checkbox" checked={days[i].enabled} onChange={(e) => updateDay(i, { enabled: e.target.checked })} />
              {label}
            </label>
            <input type="time" value={days[i].startTime} onChange={(e) => updateDay(i, { startTime: e.target.value })} disabled={!days[i].enabled} style={inputStyle} />
            <span style={{ fontSize: 13, color: "#5c6b64" }}>to</span>
            <input type="time" value={days[i].endTime} onChange={(e) => updateDay(i, { endTime: e.target.value })} disabled={!days[i].enabled} style={inputStyle} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={handleSave} disabled={saving} style={primaryButtonStyle}>
          {saving ? "Saving…" : "Save availability"}
        </button>
        {savedMessage && <span style={{ fontSize: 13, color: "#3F6B4A" }}>{savedMessage}</span>}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "6px 8px", fontSize: 14, border: "1px solid #D7D0C0", borderRadius: 6, background: "#fff", color: "var(--ink)" };
const primaryButtonStyle: React.CSSProperties = { padding: "9px 16px", fontSize: 14, fontWeight: 600, background: "var(--amber)", color: "var(--ink)", border: "none", borderRadius: 6, cursor: "pointer" };