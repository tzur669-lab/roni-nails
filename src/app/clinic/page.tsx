"use client";
import { useEffect, useState } from "react";
import { getClinicSettings } from "@/lib/firestore/settings";
import { getPaymentSettings } from "@/lib/firestore/settings";
import { buildWhatsAppContactLink } from "@/lib/whatsapp";
import { AppShell } from "@/components/shared/AppShell";
import type { ClinicSettings, PaymentSettings } from "@/types";

// Fallback constants — used if admin hasn't saved these in Firestore yet
const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/bc7jxKbh8PPgKMrT9?g_st=aw";
const BIT_PAY_URL     = "https://www.bitpay.co.il/app/me/3F9611C3-9973-F87E-2A4E-A968CD8CF9C7394F";

const DAY_LABELS: Record<string, string> = {
  sun: "ראשון", mon: "שני", tue: "שלישי",
  wed: "רביעי", thu: "חמישי", fri: "שישי", sat: "שבת",
};
const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function ClinicPage() {
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"bit" | "paybox" | null>(null);

  function copyPhone(who: "bit" | "paybox", phone: string) {
    navigator.clipboard.writeText(phone).catch(() => {});
    setCopied(who);
    setTimeout(() => setCopied(null), 2000);
  }

  useEffect(() => {
    Promise.all([getClinicSettings(), getPaymentSettings()]).then(([c, p]) => {
      setClinic(c);
      setPayment(p);
      setLoading(false);
    });
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
          <p style={{ color: "var(--muted-foreground)" }}>פרטים ומידע טרם הוגדרו</p>
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
          {(() => {
            const mapsUrl = clinic.googleMapsUrl || GOOGLE_MAPS_URL;
            return mapsUrl.includes("/maps/embed") ? (
              <div className="w-full h-48 rounded-xl overflow-hidden">
                <iframe
                  src={mapsUrl}
                  width="100%"
                  height="100%"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="border-0"
                />
              </div>
            ) : (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-sm"
                style={{ background: "var(--accent)", color: "var(--primary-dark)", border: "1px solid var(--border-color)" }}
              >
                <span>🗺️</span> פתח בגוגל מפות
              </a>
            );
          })()}
          {/* Home / exterior photo */}
          {clinic.homeImageUrl && (
            <img
              src={clinic.homeImageUrl}
              alt="תמונת המקום"
              className="w-full h-52 object-cover rounded-2xl mt-3"
            />
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

        {/* Payment — always show Bit at minimum (uses fallback URL) */}
        <div
          className="p-5 rounded-2xl border mb-4"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>💳 תשלום</h2>
          <div className="flex flex-col gap-5">

            {/* ── Bit ── */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>💙 Bit</p>

              {/* Pay button */}
              <a
                href={(payment?.bitPayUrl) || BIT_PAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white mb-3 text-sm"
                style={{ background: "#1A56DB" }}
              >
                💙 שלם ב-Bit
              </a>

              {/* Phone + copy (only if set in Firestore) */}
              {payment?.bitPhoneNumber && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }} dir="ltr">
                    {payment.bitPhoneNumber}
                  </p>
                  <button
                    onClick={() => copyPhone("bit", payment.bitPhoneNumber)}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{
                      borderColor: copied === "bit" ? "#10B981" : "var(--border-color)",
                      color:       copied === "bit" ? "#10B981" : "var(--muted-foreground)",
                    }}
                  >
                    {copied === "bit" ? "✓ הועתק" : "📋 העתק"}
                  </button>
                </div>
              )}

              {/* QR */}
              {payment?.bitQrImageUrl && (
                <img
                  src={payment.bitQrImageUrl}
                  alt="QR Bit"
                  className="w-28 h-28 object-contain rounded-xl mt-3 border"
                  style={{ borderColor: "var(--border-color)" }}
                />
              )}
            </div>

            {/* ── Paybox ── */}
            {payment?.payboxPhoneNumber && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>📱 Paybox</p>

                {/* Pay button */}
                <a
                  href={`https://payboxapp.page.link/pay?uid=${payment.payboxPhoneNumber.replace(/[-\s]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white mb-3 text-sm"
                  style={{ background: "#7C3AED" }}
                >
                  📱 שלם ב-Paybox
                </a>

                {/* Phone + copy */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }} dir="ltr">
                    {payment.payboxPhoneNumber}
                  </p>
                  <button
                    onClick={() => copyPhone("paybox", payment.payboxPhoneNumber)}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{
                      borderColor: copied === "paybox" ? "#10B981" : "var(--border-color)",
                      color:       copied === "paybox" ? "#10B981" : "var(--muted-foreground)",
                    }}
                  >
                    {copied === "paybox" ? "✓ הועתק" : "📋 העתק"}
                  </button>
                </div>
              </div>
            )}

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
