"use client";
import { useEffect, useState } from "react";
import {
  getAllAppointments, updateAppointmentStatus, cancelAppointment,
  migrateFromLegacyCollection, hasLegacyAppointments,
} from "@/lib/firestore/appointments";
import { getClinicSettings } from "@/lib/firestore/settings";
import { buildWhatsAppApprovalLink, buildWhatsAppCancellationLink } from "@/lib/whatsapp";
import type { Appointment, ClinicSettings } from "@/types";

// cancelled is shown as נדחה — only 3 visible statuses
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:          { label: "ממתין",  color: "#F59E0B" },
  change_requested: { label: "ממתין",  color: "#F59E0B" },
  approved:         { label: "מאושר",  color: "#10B981" },
  rejected:         { label: "נדחה",   color: "#EF4444" },
  cancelled:        { label: "נדחה",   color: "#EF4444" },
};

type FilterTab = "all" | "pending" | "approved" | "rejected";
const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all",      label: "הכל" },
  { value: "pending",  label: "ממתין" },
  { value: "approved", label: "מאושר" },
  { value: "rejected", label: "נדחה" },
];

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMigrate, setShowMigrate] = useState(false);
  const [migrating,   setMigrating]   = useState(false);

  useEffect(() => {
    Promise.all([getAllAppointments(), getClinicSettings(), hasLegacyAppointments()]).then(([appts, c, legacy]) => {
      // Show only: future appointments + past within 3 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3);
      cutoff.setHours(0, 0, 0, 0);
      const visible = appts.filter((a) => a.startTime.toDate() >= cutoff);
      setAppointments(visible);
      setClinic(c);
      setShowMigrate(legacy);
      setLoading(false);
    });
  }, []);

  async function runMigration() {
    if (!confirm("להעביר את כל התורים הישנים למבנה החדש?")) return;
    setMigrating(true);
    try {
      const count = await migrateFromLegacyCollection();
      alert(`✅ הועברו ${count} תורים בהצלחה!`);
      setShowMigrate(false);
      // Reload appointments from new collections
      const appts = await getAllAppointments();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3);
      cutoff.setHours(0, 0, 0, 0);
      setAppointments(appts.filter((a) => a.startTime.toDate() >= cutoff));
    } catch (err) {
      alert("שגיאה במיגרציה: " + String(err));
    } finally {
      setMigrating(false);
    }
  }

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

  async function handleCancel(appt: Appointment) {
    if (!confirm(`לבטל את התור של ${appt.clientName}?`)) return;
    await cancelAppointment(appt.id);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: "cancelled" } : a))
    );
    if (clinic) {
      const link = buildWhatsAppCancellationLink({
        clientPhone:   appt.clientPhone,
        clientName:    appt.clientName,
        serviceName:   appt.serviceName,
        startTime:     appt.startTime.toDate(),
        endTime:       appt.endTime.toDate(),
        clinicAddress: clinic.address,
      });
      window.open(link, "_blank");
    }
  }

  // Filter: "נדחה" tab includes both rejected + cancelled
  const filtered = filter === "all"
    ? appointments
    : filter === "rejected"
      ? appointments.filter((a) => a.status === "rejected" || a.status === "cancelled")
      : filter === "pending"
        ? appointments.filter((a) => a.status === "pending" || a.status === "change_requested")
        : appointments.filter((a) => a.status === filter);

  return (
    <div className="pb-20 md:pb-6">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
        ניהול תורים
      </h1>

      {/* One-time migration banner */}
      {showMigrate && (
        <div
          className="flex items-center justify-between p-4 rounded-2xl mb-4 border-2"
          style={{ borderColor: "#F59E0B", background: "#FEF3C7" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
              📦 נמצאו תורים במבנה הישן
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
              לחצי להעברתם לmcollections החדשים
            </p>
          </div>
          <button
            onClick={runMigration}
            disabled={migrating}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "#F59E0B" }}
          >
            {migrating ? "מעביר..." : "🔄 העבר"}
          </button>
        </div>
      )}

      {/* Filter tabs — 3 statuses only */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {FILTER_TABS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={
              filter === f.value
                ? { background: "var(--primary)", color: "white", borderColor: "var(--primary)" }
                : { background: "var(--surface)", color: "var(--foreground)", borderColor: "var(--border-color)" }
            }
          >
            {f.label}
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
              onCancel={handleCancel}
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
  onCancel,
}: {
  appointment: Appointment;
  onApprove: (a: Appointment) => void;
  onReject:  (id: string) => void;
  onCancel:  (a: Appointment) => void;
}) {
  const st = STATUS_LABELS[appointment.status];
  const start = appointment.startTime.toDate();
  const isPending  = appointment.status === "pending" || appointment.status === "change_requested";
  const isApproved = appointment.status === "approved";

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
      {isApproved && (
        <button
          onClick={() => onCancel(appointment)}
          className="text-xs px-3 py-1.5 rounded-xl border"
          style={{ borderColor: "#EF4444", color: "#EF4444" }}
        >
          ✕ בטל + WhatsApp
        </button>
      )}
    </div>
  );
}
