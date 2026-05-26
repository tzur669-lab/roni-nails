"use client";
import { useState } from "react";
import { updateUserPhone } from "@/lib/firestore/users";

interface Props {
  uid: string;
  onDone: () => void;
}

export function PhoneInput({ uid, onDone }: Props) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 9) {
      setError("מספר טלפון לא תקין");
      return;
    }
    setLoading(true);
    try {
      await updateUserPhone(uid, cleaned);
      onDone();
    } catch {
      setError("שגיאה בשמירה. נסי שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div
        className="w-full max-w-sm p-8 rounded-3xl shadow-xl"
        style={{ background: "var(--surface)" }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">💅</div>
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            מספר טלפון
          </h2>
          <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
            נדרש פעם אחת בלבד לאישור תורים
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-0000000"
            dir="ltr"
            className="w-full px-4 py-3 rounded-2xl border text-center text-lg"
            style={{
              borderColor: error ? "#e53e3e" : "var(--border-color)",
              background: "var(--accent)",
            }}
          />
          {error && (
            <p className="text-sm text-center" style={{ color: "#e53e3e" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "שומר..." : "המשך"}
          </button>
        </form>
      </div>
    </div>
  );
}
