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
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 8 }}>Log in</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Welcome back.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        {error && <p style={{ color: "#c0392b", fontSize: 14 }}>{error}</p>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        Don't have an account? <a href="/signup">Sign up</a>
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