"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getClientAppointments, cancelAppointment } from "@/lib/firestore/appointments";
import { AppShell } from "@/components/shared/AppShell";
import type { Appointment } from "@/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:          { label: "ממתין לאישור", color: "#F59E0B" },
  approved:         { label: "מאושר ✓",       color: "#10B981" },
  rejected:         { label: "נדחה",          color: "#EF4444" },
  cancelled:        { label: "בוטל",          color: "#9CA3AF" },
  change_requested: { label: "בקשת שינוי",   color: "#8B5CF6" },
};

function formatDateTime(d: Date): string {
  return d.toLocaleString("he-IL", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MyAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getClientAppointments(user.uid).then((a) => {
      setAppointments(a);
      setLoading(false);
    });
  }, [user]);

  async function handleCancel(id: string) {
    if (!confirm("לבטל את התור?")) return;
    await cancelAppointment(id);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    );
  }

  // Upcoming: future appointments that are not cancelled/rejected
  const upcoming = appointments.filter(
    (a) => a.startTime.toDate() > new Date() && a.status !== "cancelled" && a.status !== "rejected"
  );
  // History: past non-cancelled appointments + rejected (no cancelled ever shown)
  const past = appointments.filter(
    (a) => a.status !== "cancelled" && (a.startTime.toDate() <= new Date() || a.status === "rejected")
  );

  if (!user) {
    return (
      <AppShell>
        <div className="pt-16 text-center">
          <p className="text-base mb-4" style={{ color: "var(--muted-foreground)" }}>
            יש להתחבר כדי לצפות בתורים
          </p>
          <Link
            href="/login"
            className="px-6 py-3 rounded-2xl font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            התחברות
          </Link>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="pt-16 text-center text-3xl animate-pulse">💅</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-6 pb-10">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
          התורים שלי
        </h1>

        {upcoming.length > 0 && (
          <>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-foreground)" }}>
              עתידיים
            </h2>
            <div className="flex flex-col gap-3 mb-8">
              {upcoming.map((a) => (
                <AppointmentCard key={a.id} appointment={a} onCancel={handleCancel} />
              ))}
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-foreground)" }}>
              היסטוריה
            </h2>
            <div className="flex flex-col gap-3">
              {past.map((a) => (
                <AppointmentCard key={a.id} appointment={a} onCancel={handleCancel} />
              ))}
            </div>
          </>
        )}

        {upcoming.length === 0 && past.length === 0 && (
          <div className="text-center pt-16">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
              עדיין אין לך תורים
            </p>
            <Link
              href="/book"
              className="px-6 py-3 rounded-2xl font-semibold text-white"
              style={{ background: "var(--primary)" }}
            >
              הזמן תור ראשון
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function AppointmentCard({
  appointment,
  onCancel,
}: {
  appointment: Appointment;
  onCancel: (id: string) => void;
}) {
  const st = STATUS_LABELS[appointment.status] ?? { label: appointment.status, color: "#9CA3AF" };
  const start = appointment.startTime.toDate();
  const isFuture = start > new Date();
  const canCancel = appointment.status === "pending" && isFuture;
  const approvedFuture = appointment.status === "approved" && isFuture;

  return (
    <div
      className="p-5 rounded-2xl border"
      style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            {appointment.serviceName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {formatDateTime(start)}
          </p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ background: `${st.color}20`, color: st.color }}
        >
          {st.label}
        </span>
      </div>

      {canCancel && (
        <button
          onClick={() => onCancel(appointment.id)}
          className="text-xs px-3 py-1.5 rounded-xl border"
          style={{ borderColor: "#EF4444", color: "#EF4444" }}
        >
          ביטול תור
        </button>
      )}

      {approvedFuture && (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          לשינוי תור — פנה לרני ישירות
        </p>
      )}
    </div>
  );
}
