"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: any) {
    e.preventDefault();
    const r = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    });
    const j = await r.json();
    if (j.ok) window.location.href = "/login";
    else alert(j.error || "Register error");
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Register</h1>
      <input className="w-full p-2 border" placeholder="Name (optional)" onChange={(e) => setName(e.target.value)} />
      <input className="w-full p-2 border" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full p-2 border" placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
      <button className="px-4 py-2 bg-blue-600 text-white rounded">Create account</button>
    </form>
  );
}
