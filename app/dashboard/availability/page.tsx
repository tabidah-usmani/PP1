"use client";

import { useEffect, useState } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DaySetting = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

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
              return match
                ? { enabled: true, startTime: match.startTime, endTime: match.endTime }
                : { ...d, enabled: false };
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

  if (loading) {
    return (
      <main style={{ maxWidth: 500, margin: "40px auto", padding: "0 16px" }}>
        <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 500, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Weekly availability</h1>
      <p style={{ margin: "4px 0 20px", color: "#666", fontSize: 14 }}>
        Set the hours clients can book you on your public booking page.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DAYS.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, width: 110, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={days[i].enabled}
                onChange={(e) => updateDay(i, { enabled: e.target.checked })}
              />
              {label}
            </label>
            <input
              type="time"
              value={days[i].startTime}
              onChange={(e) => updateDay(i, { startTime: e.target.value })}
              disabled={!days[i].enabled}
              style={inputStyle}
            />
            <span style={{ fontSize: 13, color: "#666" }}>to</span>
            <input
              type="time"
              value={days[i].endTime}
              onChange={(e) => updateDay(i, { endTime: e.target.value })}
              disabled={!days[i].enabled}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={handleSave} disabled={saving} style={primaryButtonStyle}>
          {saving ? "Saving…" : "Save availability"}
        </button>
        {savedMessage && <span style={{ fontSize: 13, color: "#2e7d32" }}>{savedMessage}</span>}
      </div>

      <p style={{ marginTop: 20 }}>
        <a href="/dashboard" style={{ fontSize: 14 }}>← Back to dashboard</a>
      </p>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "6px 8px",
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