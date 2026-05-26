"use client";
import { useEffect, useState } from "react";
import { getClinicSettings, saveClinicSettings } from "@/lib/firestore/settings";
import type { ClinicSettings } from "@/types";

const DEFAULT_HOURS = { open: "09:00", close: "19:00", isOpen: true };
const DEFAULT: ClinicSettings = {
  name: "רוני ניילס",
  address: "",
  phone: "",
  whatsappNumber: "",
  instagramUrl: "",
  googleMapsUrl: "",
  openingHours: {
    sun: { ...DEFAULT_HOURS },
    mon: { ...DEFAULT_HOURS },
    tue: { ...DEFAULT_HOURS },
    wed: { ...DEFAULT_HOURS },
    thu: { ...DEFAULT_HOURS },
    fri: { open: "09:00", close: "15:00", isOpen: true },
    sat: { open: "09:00", close: "14:00", isOpen: false },
  },
  galleryImages: [],
};

const DAY_LABELS: Record<string, string> = {
  sun: "ראשון", mon: "שני", tue: "שלישי",
  wed: "רביעי", thu: "חמישי", fri: "שישי", sat: "שבת",
};
const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function AdminClinicPage() {
  const [clinic, setClinic] = useState<ClinicSettings>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getClinicSettings().then((c) => { if (c) setClinic(c); });
  }, []);

  async function save() {
    setSaving(true);
    await saveClinicSettings(clinic);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function setField<K extends keyof ClinicSettings>(k: K, v: ClinicSettings[K]) {
    setClinic((prev) => ({ ...prev, [k]: v }));
  }

  function setHours(day: string, field: "open" | "close" | "isOpen", value: string | boolean) {
    setClinic((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: { ...prev.openingHours[day as keyof typeof prev.openingHours], [field]: value },
      },
    }));
  }

  return (
    <div className="pb-20 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>פרטי הסלון</h1>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: saved ? "#10B981" : "var(--primary)" }}>
          {saving ? "שומר..." : saved ? "✓ נשמר" : "שמור"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <Section title="פרטים כלליים">
          <Input label="שם הסלון" value={clinic.name} onChange={(v) => setField("name", v)} />
          <Input label="כתובת" value={clinic.address} onChange={(v) => setField("address", v)} />
          <Input label="טלפון" value={clinic.phone} onChange={(v) => setField("phone", v)} type="tel" dir="ltr" />
          <Input label="WhatsApp (ללא רווחים, עם קידומת 972)" value={clinic.whatsappNumber} onChange={(v) => setField("whatsappNumber", v)} dir="ltr" />
          <Input label="אינסטגרם URL" value={clinic.instagramUrl} onChange={(v) => setField("instagramUrl", v)} dir="ltr" />
          <Input label="Google Maps Embed URL" value={clinic.googleMapsUrl} onChange={(v) => setField("googleMapsUrl", v)} dir="ltr" />
        </Section>

        <Section title="שעות פעילות">
          {DAY_ORDER.map((day) => {
            const h = clinic.openingHours[day as keyof typeof clinic.openingHours];
            return (
              <div key={day} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-20 cursor-pointer">
                  <input type="checkbox" checked={h.isOpen} onChange={(e) => setHours(day, "isOpen", e.target.checked)} />
                  <span className="text-sm" style={{ color: "var(--foreground)" }}>{DAY_LABELS[day]}</span>
                </label>
                {h.isOpen && (
                  <>
                    <input type="time" value={h.open} onChange={(e) => setHours(day, "open", e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--border-color)", background: "var(--accent)" }} />
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>–</span>
                    <input type="time" value={h.close} onChange={(e) => setHours(day, "close", e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--border-color)", background: "var(--accent)" }} />
                  </>
                )}
                {!h.isOpen && (
                  <span className="text-sm" style={{ color: "#9CA3AF" }}>סגור</span>
                )}
              </div>
            );
          })}
        </Section>

        <Section title="גלריה (URLs)">
          <div className="flex flex-col gap-2">
            {clinic.galleryImages.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => {
                    const imgs = [...clinic.galleryImages];
                    imgs[i] = e.target.value;
                    setField("galleryImages", imgs);
                  }}
                  dir="ltr"
                  className="flex-1 px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
                />
                <button onClick={() => setField("galleryImages", clinic.galleryImages.filter((_, j) => j !== i))}
                  className="px-3 py-2 rounded-xl text-sm" style={{ color: "#EF4444" }}>✕</button>
              </div>
            ))}
            <button
              onClick={() => setField("galleryImages", [...clinic.galleryImages, ""])}
              className="text-sm px-4 py-2 rounded-xl border"
              style={{ borderColor: "var(--border-color)", color: "var(--primary-dark)" }}
            >
              + הוסף תמונה
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl border" style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}>
      <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", dir }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; dir?: string;
}) {
  return (
    <div>
      <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        className="w-full px-4 py-3 rounded-xl border"
        style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
      />
    </div>
  );
}
