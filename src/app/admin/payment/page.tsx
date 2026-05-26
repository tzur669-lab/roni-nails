"use client";
import { useEffect, useState } from "react";
import { getPaymentSettings, savePaymentSettings } from "@/lib/firestore/settings";
import type { PaymentSettings } from "@/types";

const DEFAULT: PaymentSettings = {
  bitQrImageUrl: "",
  bitPhoneNumber: "",
  payboxPhoneNumber: "",
};

export default function AdminPaymentPage() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPaymentSettings().then((s) => { if (s) setSettings(s); });
  }, []);

  async function save() {
    setSaving(true);
    await savePaymentSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="pb-20 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>הגדרות תשלום</h1>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: saved ? "#10B981" : "var(--primary)" }}>
          {saving ? "שומר..." : saved ? "✓ נשמר" : "שמור"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="p-5 rounded-2xl border" style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>💰 Bit</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>מספר טלפון ל-Bit</label>
              <input
                type="tel"
                value={settings.bitPhoneNumber}
                onChange={(e) => setSettings((p) => ({ ...p, bitPhoneNumber: e.target.value }))}
                dir="ltr"
                placeholder="050-0000000"
                className="w-full px-4 py-3 rounded-xl border"
                style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>URL של QR קוד ל-Bit</label>
              <input
                value={settings.bitQrImageUrl}
                onChange={(e) => setSettings((p) => ({ ...p, bitQrImageUrl: e.target.value }))}
                dir="ltr"
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border"
                style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
              />
            </div>
            {settings.bitQrImageUrl && (
              <div className="flex justify-center">
                <img src={settings.bitQrImageUrl} alt="QR Bit" className="w-32 h-32 object-contain rounded-xl border"
                  style={{ borderColor: "var(--border-color)" }} />
              </div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>📱 Paybox</h2>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>מספר טלפון ל-Paybox</label>
            <input
              type="tel"
              value={settings.payboxPhoneNumber}
              onChange={(e) => setSettings((p) => ({ ...p, payboxPhoneNumber: e.target.value }))}
              dir="ltr"
              placeholder="050-0000000"
              className="w-full px-4 py-3 rounded-xl border"
              style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            💡 פרטי התשלום יוצגו ללקוחות לאחר אישור התור
          </p>
        </div>
      </div>
    </div>
  );
}
