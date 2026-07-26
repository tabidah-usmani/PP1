"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, businessType }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Something went wrong. Try again.");
      return;
    }

    // Signup route already set the session cookie, so we can go straight to the dashboard
    router.push("/dashboard");
  }

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 8 }}>Create your account</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Set up your business to start managing clients and bookings.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder="Business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Business type (optional, e.g. salon)"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: "#c0392b", fontSize: 14 }}>{error}</p>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        Already have an account? <a href="/login">Log in</a>
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

const buttonStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  fontWeight: 500,
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};