"use client";
import { useState } from "react";
import type { GuestInfo } from "@/types";

interface Props {
  onSubmit: (info: GuestInfo) => void;
  loading?: boolean;
}

export function GuestForm({ onSubmit, loading }: Props) {
  const [name, setName] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("guestName") ?? "";
  });
  const [phone, setPhone] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("guestPhone") ?? "";
  });
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!name.trim()) { setError("יש להזין שם"); return; }
    if (cleanPhone.length < 9) { setError("מספר טלפון לא תקין"); return; }
    localStorage.setItem("guestName", name.trim());
    localStorage.setItem("guestPhone", cleanPhone);
    onSubmit({ name: name.trim(), phone: cleanPhone });
  }

  return (
    <div
      className="p-6 rounded-2xl border"
      style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
    >
      <h3 className="text-base font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        פרטי הזמנה
      </h3>
      <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
        לא חייבים חשבון — רק שם וטלפון
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="שם מלא"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border"
          style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
        />
        <input
          type="tel"
          placeholder="מספר טלפון"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          dir="ltr"
          className="w-full px-4 py-3 rounded-xl border"
          style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
        />
        {error && (
          <p className="text-sm" style={{ color: "#e53e3e" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--primary)" }}
        >
          {loading ? "שולח..." : "שלח בקשה"}
        </button>
      </form>
    </div>
  );
}
