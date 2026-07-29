"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Something went wrong. Try again.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ maxWidth: 400, width: "100%" }}>
        <a href="/" className="font-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", textDecoration: "none", display: "block", marginBottom: 32 }}>
          Ledger
        </a>

        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 600, margin: "0 0 6px", color: "var(--ink)" }}>
          Welcome back
        </h1>
        <p style={{ color: "#5c6b64", marginBottom: 28, fontSize: 14.5 }}>Log in to your dashboard.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />

          {error && <p style={{ color: "#B65C3D", fontSize: 14, margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 14, color: "#5c6b64" }}>
          Don't have an account? <a href="/signup" style={{ color: "var(--ink)", fontWeight: 600 }}>Sign up</a>
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 14,
  border: "1px solid #D7D0C0",
  borderRadius: 6,
  background: "#fff",
  color: "var(--ink)",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 14,
  fontWeight: 600,
  background: "var(--amber)",
  color: "var(--ink)",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginTop: 6,
};