"use client";
import { formatHebrewFullDate } from "@/lib/hebrew-calendar";
import { buildGoogleCalendarLink } from "@/lib/google-calendar";
import type { Service } from "@/types";

interface Props {
  service: Service;
  startTime: Date;
  endTime: Date;
  clientName: string;
  clinicAddress?: string;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function BookingConfirmation({ service, startTime, endTime, clientName, clinicAddress }: Props) {
  const calendarLink = buildGoogleCalendarLink({
    title: `תור ללק רני חנימוב — ${service.name}`,
    startTime,
    endTime,
    description: `שירות: ${service.name}${service.price ? ` · מחיר: ₪${service.price}` : ""}`,
    location: clinicAddress,
  });

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: "var(--accent)", border: "2px solid var(--primary)" }}
    >
      {/* Header */}
      <div className="text-center py-8 px-6">
        <div className="text-6xl mb-4">🌸</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          הבקשה נשלחה!
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          רני תאשר את התור ותעדכן אותך בקרוב בוואטסאפ
        </p>
      </div>

      {/* Appointment details card */}
      <div className="mx-4 mb-4 p-5 rounded-2xl" style={{ background: "var(--surface)" }}>
        {/* Service name big */}
        <p className="text-lg font-bold text-center mb-4" style={{ color: "var(--primary-dark)" }}>
          {service.name}
        </p>

        <div className="flex flex-col gap-3">
          {/* Date — extra prominent */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: "var(--accent)" }}
          >
            <span className="text-2xl">📅</span>
            <div className="text-right">
              <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>תאריך</p>
              <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                {startTime.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>

          {/* Time — extra prominent */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: "var(--accent)" }}
          >
            <span className="text-2xl">🕐</span>
            <div className="text-right">
              <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>שעה</p>
              <p className="text-2xl font-bold tracking-wide" style={{ color: "var(--primary-dark)" }}>
                {formatTime(startTime)}
              </p>
            </div>
          </div>

          {/* Other details */}
          <div className="flex flex-col gap-1.5 pt-1">
            <Row label="שם"    value={clientName} />
            <Row label="תאריך עברי" value={formatHebrewFullDate(startTime)} />
            {service.price && <Row label="מחיר" value={`₪${service.price}`} />}
          </div>
        </div>
      </div>

      {/* Google Calendar button */}
      <div className="px-4 pb-6">
        <a
          href={calendarLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "#4285F4" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
          הוסף ליומן Google
        </a>
        {/* Waiting banner — prominent */}
        <div
          className="mt-4 p-4 rounded-2xl text-center"
          style={{ background: "#FEF3C7", border: "1.5px solid #F59E0B" }}
        >
          <p className="text-base font-bold mb-1" style={{ color: "#92400E" }}>
            ⏳ ממתין לאישור
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#B45309" }}>
            רני תאשר את הבקשה ותעדכן אותך בוואטסאפ בהקדם 💬
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <span className="font-medium" style={{ color: "var(--foreground)" }}>{value}</span>
    </div>
  );
}
