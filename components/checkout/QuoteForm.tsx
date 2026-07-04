"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartProvider";

export function QuoteForm() {
  const { lines } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cart_snapshot: lines.length ? lines : null,
      }),
    });
    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <div className="card p-6 text-center">
        <p className="font-serif text-lg text-wine">Thanks!</p>
        <p className="mt-1 text-sm text-ink/70">
          We&apos;ve received your request and will get back to you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <label className="block">
        <span className="mb-1 block text-sm text-ink/70">Name</span>
        <input
          className="input"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-ink/70">Email</span>
        <input
          className="input"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-ink/70">Phone (optional)</span>
        <input
          className="input"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-ink/70">Message</span>
        <textarea
          className="input min-h-24"
          required
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
        />
      </label>

      {status === "error" && (
        <p className="text-sm text-red-700">Something went wrong. Try again.</p>
      )}

      <button className="btn-primary w-full" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send request"}
      </button>
      <p className="text-center text-xs text-ink/50">
        Your current cart is included with the request.
      </p>
    </form>
  );
}
