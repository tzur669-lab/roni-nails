"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getTodayAppointments,
  getAllAppointments,
  getUpcomingAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} from "@/lib/firestore/appointments";
import { getClinicSettings } from "@/lib/firestore/settings";
import { buildWhatsAppApprovalLink, buildWhatsAppCancellationLink } from "@/lib/whatsapp";
import type { Appointment, ClinicSettings } from "@/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:          { label: "ממתין",     color: "#F59E0B" },
  approved:         { label: "מאושר",     color: "#10B981" },
  rejected:         { label: "נדחה",      color: "#EF4444" },
  cancelled:        { label: "בוטל",      color: "#9CA3AF" },
  change_requested: { label: "שינוי",     color: "#8B5CF6" },
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}
function formatDateShort(d: Date): string {
  return d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "short" });
}

export default function AdminDashboard() {
  const [todayAppts, setTodayAppts]   = useState<Appointment[]>([]);
  const [pending,    setPending]      = useState<Appointment[]>([]);
  const [upcoming,   setUpcoming]     = useState<Appointment[]>([]);
  const [clinic,     setClinic]       = useState<ClinicSettings | null>(null);
  const [loading,    setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      getTodayAppointments(),
      getAllAppointments(),
      getUpcomingAppointments(),
      getClinicSettings(),
    ]).then(([today, all, up, c]) => {
      setTodayAppts(today);
      setPending(all.filter((a) => a.status === "pending" || a.status === "change_requested"));
      setUpcoming(up);
      setClinic(c);
      setLoading(false);
    });
  }, []);

  async function approve(appt: Appointment) {
    await updateAppointmentStatus(appt.id, "approved");
    setPending((prev) => prev.filter((a) => a.id !== appt.id));
    setTodayAppts((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: "approved" } : a))
    );
    setUpcoming((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: "approved" } : a))
    );
    if (clinic) {
      const link = buildWhatsAppApprovalLink({
        clientPhone: appt.clientPhone,
        clientName:  appt.clientName,
        serviceName: appt.serviceName,
        startTime:   appt.startTime.toDate(),
        endTime:     appt.endTime.toDate(),
        clinicAddress: clinic.address,
      });
      window.open(link, "_blank");
    }
  }

  async function reject(id: string) {
    await updateAppointmentStatus(id, "rejected");
    setPending((prev) => prev.filter((a) => a.id !== id));
    setTodayAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)));
    setUpcoming((prev) => prev.filter((a) => a.id !== id));
  }

  async function cancel(appt: Appointment) {
    if (!confirm(`לבטל את התור של ${appt.clientName}?`)) return;
    await cancelAppointment(appt.id);
    setUpcoming((prev) => prev.filter((a) => a.id !== appt.id));
    setTodayAppts((prev) => prev.map((a) => (a.id === appt.id ? { ...a, status: "cancelled" } : a)));
    if (clinic) {
      const link = buildWhatsAppCancellationLink({
        clientPhone: appt.clientPhone,
        clientName:  appt.clientName,
        serviceName: appt.serviceName,
        startTime:   appt.startTime.toDate(),
        endTime:     appt.endTime.toDate(),
        clinicAddress: clinic.address,
      });
      window.open(link, "_blank");
    }
  }

  if (loading) {
    return <div className="pt-16 text-center text-3xl animate-pulse">💅</div>;
  }

  return (
    <div className="pb-20 md:pb-6">
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
        לוח ניהול
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="תורים היום"       value={todayAppts.length}                              icon="📅" />
        <StatCard label="ממתינים לאישור"   value={pending.length}   icon="⏳" highlight={pending.length > 0} />
        <StatCard label="מאושרים היום"     value={todayAppts.filter(a => a.status === "approved").length} icon="✅" />
      </div>

      {/* Today schedule */}
      {todayAppts.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-foreground)" }}>
            לוח היום
          </h2>
          <div className="flex flex-col gap-2">
            {todayAppts.map((a) => {
              const st = STATUS_LABELS[a.status];
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-4 rounded-2xl border"
                  style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
                >
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{a.clientName}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {formatTime(a.startTime.toDate())} · {a.serviceName}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: `${st?.color}20`, color: st?.color }}
                  >
                    {st?.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pending approvals */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-foreground)" }}>
          ממתינים לאישור {pending.length > 0 && `(${pending.length})`}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--muted-foreground)" }}>
            אין בקשות ממתינות 🎉
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((a) => (
              <PendingCard key={a.id} appointment={a} onApprove={approve} onReject={reject} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming appointments */}
      {upcoming.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-foreground)" }}>
            תורים קרובים ({upcoming.length})
          </h2>
          <div className="flex flex-col gap-2">
            {upcoming.map((a) => {
              const st = STATUS_LABELS[a.status];
              const start = a.startTime.toDate();
              return (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl border"
                  style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
                        {a.clientName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                        {a.serviceName} · {formatDateShort(start)} · {formatTime(start)}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                      style={{ background: `${st?.color}20`, color: st?.color }}
                    >
                      {st?.label}
                    </span>
                  </div>
                  {a.status === "approved" && (
                    <button
                      onClick={() => cancel(a)}
                      className="text-xs px-3 py-1.5 rounded-xl border"
                      style={{ borderColor: "#EF4444", color: "#EF4444" }}
                    >
                      ✕ ביטול + WhatsApp
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {[
          { href: "/admin/appointments", label: "כל התורים",  icon: "📅" },
          { href: "/admin/services",     label: "שירותים",    icon: "✨" },
          { href: "/admin/availability", label: "זמינות",     icon: "🗓" },
          { href: "/admin/clients",      label: "לקוחות",     icon: "👥" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-sm"
            style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: {
  label: string; value: number; icon: string; highlight?: boolean;
}) {
  return (
    <div
      className="p-4 rounded-2xl text-center border"
      style={{
        borderColor: highlight ? "var(--primary)" : "var(--border-color)",
        background:  highlight ? "var(--accent)"  : "var(--surface)",
      }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</div>
    </div>
  );
}

function PendingCard({
  appointment,
  onApprove,
  onReject,
}: {
  appointment: Appointment;
  onApprove: (a: Appointment) => void;
  onReject:  (id: string) => void;
}) {
  const start = appointment.startTime.toDate();
  return (
    <div
      className="p-5 rounded-2xl border-2"
      style={{ borderColor: "var(--primary)", background: "var(--surface)" }}
    >
      <div className="mb-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              {appointment.clientName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {appointment.clientPhone}
            </p>
          </div>
          {appointment.status === "change_requested" && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#8B5CF620", color: "#8B5CF6" }}>
              בקשת שינוי
            </span>
          )}
        </div>
        <div className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <span>{appointment.serviceName}</span>
          <span className="mx-2">·</span>
          <span>{start.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "short" })}</span>
          <span className="mx-2">·</span>
          <span>{formatTime(start)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onApprove(appointment)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#10B981" }}
        >
          ✓ אשר + WhatsApp
        </button>
        <button
          onClick={() => onReject(appointment.id)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2"
          style={{ borderColor: "#EF4444", color: "#EF4444" }}
        >
          ✕ דחה
        </button>
      </div>
    </div>
  );
}
