"use client";
import { formatHebrewFullDate } from "@/lib/hebrew-calendar";
import type { Service } from "@/types";

interface Props {
  service: Service;
  startTime: Date;
  endTime: Date;
  clientName: string;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function BookingConfirmation({ service, startTime, endTime, clientName }: Props) {
  return (
    <div
      className="text-center p-8 rounded-3xl"
      style={{ background: "var(--accent)" }}
    >
      <div className="text-5xl mb-4">🌸</div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
        הבקשה נשלחה!
      </h2>
      <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
        רוני תאשר את התור ותעדכן אותך בקרוב.
      </p>

      <div
        className="text-right p-5 rounded-2xl mb-4"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex flex-col gap-2 text-sm">
          <Row label="שם" value={clientName} />
          <Row label="שירות" value={service.name} />
          <Row label="תאריך" value={formatHebrewFullDate(startTime)} />
          <Row label="שעה" value={`${formatTime(startTime)} – ${formatTime(endTime)}`} />
          {service.price && <Row label="מחיר" value={`₪${service.price}`} />}
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        סטטוס התור יעודכן ותקבלי הודעה לאחר האישור
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <span className="font-medium" style={{ color: "var(--foreground)" }}>{value}</span>
    </div>
  );
}
