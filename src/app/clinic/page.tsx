"use client";
import { useEffect, useState } from "react";
import { getClinicSettings } from "@/lib/firestore/settings";
import { buildWhatsAppContactLink } from "@/lib/whatsapp";
import { AppShell } from "@/components/shared/AppShell";
import type { ClinicSettings } from "@/types";

const DAY_LABELS: Record<string, string> = {
  sun: "ראשון", mon: "שני", tue: "שלישי",
  wed: "רביעי", thu: "חמישי", fri: "שישי", sat: "שבת",
};
const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function ClinicPage() {
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClinicSettings().then((c) => { setClinic(c); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="pt-16 text-center text-3xl animate-pulse">💅</div>
      </AppShell>
    );
  }

  if (!clinic) {
    return (
      <AppShell>
        <div className="pt-16 text-center">
          <p style={{ color: "var(--muted-foreground)" }}>פרטי הסלון טרם הוגדרו</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-6 pb-10">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
          {clinic.name}
        </h1>

        {/* Gallery */}
        {clinic.galleryImages.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-3 mb-6">
            {clinic.galleryImages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`גלריה ${i + 1}`}
                className="flex-shrink-0 w-36 h-36 object-cover rounded-2xl"
              />
            ))}
          </div>
        )}

        {/* Address + Map */}
        <div
          className="p-5 rounded-2xl border mb-4"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        >
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>📍 כתובת</h2>
          <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>{clinic.address}</p>
          {clinic.googleMapsUrl && (
            <div className="w-full h-48 rounded-xl overflow-hidden">
              <iframe
                src={clinic.googleMapsUrl}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="border-0"
              />
            </div>
          )}
        </div>

        {/* Opening hours */}
        <div
          className="p-5 rounded-2xl border mb-4"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>🕐 שעות פעילות</h2>
          <div className="flex flex-col gap-2">
            {DAY_ORDER.map((key) => {
              const h = clinic.openingHours[key as keyof typeof clinic.openingHours];
              return (
                <div key={key} className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>{DAY_LABELS[key]}</span>
                  <span style={{ color: h.isOpen ? "var(--foreground)" : "#9CA3AF" }}>
                    {h.isOpen ? `${h.open} – ${h.close}` : "סגור"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact buttons */}
        <div className="flex flex-col gap-3">
          {clinic.whatsappNumber && (
            <a
              href={buildWhatsAppContactLink(clinic.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-white"
              style={{ background: "#25D366" }}
            >
              <span>📱</span> שלחי הודעה ב-WhatsApp
            </a>
          )}
          {clinic.phone && (
            <a
              href={`tel:${clinic.phone}`}
              className="flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold border-2"
              style={{ borderColor: "var(--primary)", color: "var(--primary-dark)" }}
            >
              <span>📞</span> חייגי
            </a>
          )}
          {clinic.instagramUrl && (
            <a
              href={clinic.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold border-2"
              style={{ borderColor: "var(--border-color)", color: "var(--foreground)" }}
            >
              <span>📸</span> אינסטגרם
            </a>
          )}
        </div>
      </div>
    </AppShell>
  );
}
