// app/login/page.tsx
"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // IMPORTANT - server expects JSON
        },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (j?.ok) {
        window.location.href = "/";
      } else {
        alert(j?.error || "Login failed");
      }
    } catch (err) {
      console.error("login error", err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Sign in</h1>

      {/* Force light input background and dark text so it's readable in dark theme */}
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-3 border rounded bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        autoComplete="email"
      />

      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        className="w-full p-3 border rounded bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        autoComplete="current-password"
      />

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
