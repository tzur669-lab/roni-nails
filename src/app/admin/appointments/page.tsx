"use client";
import { useEffect, useState } from "react";
import { getAllAppointments, updateAppointmentStatus } from "@/lib/firestore/appointments";
import { getClinicSettings } from "@/lib/firestore/settings";
import { buildWhatsAppApprovalLink } from "@/lib/whatsapp";
import type { Appointment, ClinicSettings, AppointmentStatus } from "@/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:          { label: "ממתין",     color: "#F59E0B" },
  approved:         { label: "מאושר",     color: "#10B981" },
  rejected:         { label: "נדחה",      color: "#EF4444" },
  cancelled:        { label: "בוטל",      color: "#9CA3AF" },
  change_requested: { label: "בקשת שינוי", color: "#8B5CF6" },
};

type FilterStatus = AppointmentStatus | "all";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllAppointments(), getClinicSettings()]).then(([appts, c]) => {
      setAppointments(appts);
      setClinic(c);
      setLoading(false);
    });
  }, []);

  async function handleApprove(appt: Appointment) {
    await updateAppointmentStatus(appt.id, "approved");
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: "approved" } : a))
    );
    if (clinic) {
      const link = buildWhatsAppApprovalLink({
        clientPhone: appt.clientPhone,
        clientName: appt.clientName,
        serviceName: appt.serviceName,
        startTime: appt.startTime.toDate(),
        endTime: appt.endTime.toDate(),
        clinicAddress: clinic.address,
      });
      window.open(link, "_blank");
    }
  }

  async function handleReject(id: string) {
    await updateAppointmentStatus(id, "rejected");
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a))
    );
  }

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div className="pb-20 md:pb-6">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
        ניהול תורים
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {(["all", "pending", "approved", "rejected", "cancelled"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={
              filter === f
                ? { background: "var(--primary)", color: "white", borderColor: "var(--primary)" }
                : { background: "var(--surface)", color: "var(--foreground)", borderColor: "var(--border-color)" }
            }
          >
            {f === "all" ? "הכל" : STATUS_LABELS[f]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-3xl animate-pulse">💅</div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-10 text-sm" style={{ color: "var(--muted-foreground)" }}>
          אין תורים
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((appt) => (
            <AppointmentRow
              key={appt.id}
              appointment={appt}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentRow({
  appointment,
  onApprove,
  onReject,
}: {
  appointment: Appointment;
  onApprove: (a: Appointment) => void;
  onReject: (id: string) => void;
}) {
  const st = STATUS_LABELS[appointment.status];
  const start = appointment.startTime.toDate();
  const isPending = appointment.status === "pending" || appointment.status === "change_requested";

  return (
    <div
      className="p-5 rounded-2xl border"
      style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            {appointment.clientName}
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {appointment.clientPhone}
          </p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ background: `${st?.color}20`, color: st?.color }}
        >
          {st?.label}
        </span>
      </div>
      <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
        {appointment.serviceName} ·{" "}
        {start.toLocaleDateString("he-IL", { day: "numeric", month: "long" })} ·{" "}
        {start.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
      </p>
      {isPending && (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(appointment)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: "#10B981" }}
          >
            ✓ אשר + WhatsApp
          </button>
          <button
            onClick={() => onReject(appointment.id)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold border-2"
            style={{ borderColor: "#EF4444", color: "#EF4444" }}
          >
            ✕ דחה
          </button>
        </div>
      )}
    </div>
  );
}
