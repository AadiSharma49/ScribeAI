// components/Header.tsx  (client)
"use client";
import { useEffect, useState } from "react";

export default function Header() {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => { if (j?.ok) setUser(j.user); });
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="border-b border-muted/60 bg-background/80 backdrop-blur">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold">
            SA
          </div>
          <span className="font-semibold text-lg tracking-tight">ScribeAI</span>
        </div>

        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="/" className="px-3 py-1.5 rounded-full border border-muted hover:border-primary/70 hover:bg-muted/60 transition text-xs">Dashboard</a>

          {!user ? (
            <>
              <a href="/login" className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 transition">Sign in</a>
              <a href="/register" className="px-3 py-1.5 rounded-full border border-muted text-xs text-muted-foreground">Register</a>
            </>
          ) : (
            <>
              <span className="text-sm">{user.email}</span>
              <button onClick={logout} className="px-3 py-1.5 rounded-full bg-red-600 text-xs text-white">Sign out</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
