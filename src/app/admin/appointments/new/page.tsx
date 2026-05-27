"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { getServices } from "@/lib/firestore/services";
import { getAllClients } from "@/lib/firestore/users";
import { createAdminAppointment } from "@/lib/firestore/appointments";
import type { Service, AppUser } from "@/types";

export default function AdminNewAppointmentPage() {
  const router = useRouter();

  const [services, setServices]   = useState<Service[]>([]);
  const [clients,  setClients]    = useState<AppUser[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [saving,   setSaving]     = useState(false);

  // Client
  const [clientType, setClientType] = useState<"registered" | "custom">("custom");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [customName,  setCustomName]  = useState("");
  const [customPhone, setCustomPhone] = useState("");

  // Appointment details
  const [serviceId,  setServiceId]  = useState("");
  const [date,       setDate]       = useState("");
  const [startTime,  setStartTime]  = useState("");
  const [notes,      setNotes]      = useState("");

  useEffect(() => {
    Promise.all([getServices(false), getAllClients()]).then(([svcs, cls]) => {
      setServices(svcs);
      setClients(cls);
      setLoading(false);
    });
  }, []);

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedClient  = clients.find((c) => c.id === selectedClientId);

  const filteredClients = clients.filter(
    (c) =>
      !clientSearch ||
      c.name.includes(clientSearch) ||
      c.phone.includes(clientSearch)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService || !date || !startTime) return;
    if (clientType === "registered" && !selectedClientId) {
      alert("יש לבחור לקוחה");
      return;
    }
    if (clientType === "custom" && !customName.trim()) {
      alert("יש להזין שם לקוחה");
      return;
    }

    setSaving(true);
    try {
      const startDate = new Date(`${date}T${startTime}`);
      const endDate   = new Date(startDate.getTime() + selectedService.duration * 60_000);

      const clientName  = clientType === "registered" ? (selectedClient?.name  ?? "") : customName.trim();
      const clientPhone = clientType === "registered" ? (selectedClient?.phone ?? "") : customPhone.trim();
      const clientId    = clientType === "registered" ? selectedClientId : "admin_entry";

      await createAdminAppointment({
        clientId,
        clientName,
        clientPhone,
        serviceId:       selectedService.id,
        serviceName:     selectedService.name,
        serviceDuration: selectedService.duration,
        startTime: Timestamp.fromDate(startDate),
        endTime:   Timestamp.fromDate(endDate),
        status:    "approved",
        notes:     notes.trim() || undefined,
        isGuest:   false,
      });

      router.push("/admin/appointments");
    } catch (err) {
      console.error("createAdminAppointment failed:", err);
      alert("שגיאה ביצירת התור. נסי שנית.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="pt-16 text-center text-3xl animate-pulse">💅</div>;
  }

  return (
    <div className="pb-20 md:pb-6 max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm flex items-center gap-1"
          style={{ color: "var(--primary-dark)" }}
        >
          ← חזרה
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
          הוספת תור ידנית
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* ── Client section ───────────────────────────────────── */}
        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
            לקוחה
          </p>

          {/* Toggle */}
          <div className="flex gap-2 mb-4">
            {(["registered", "custom"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setClientType(t); setSelectedClientId(""); setClientSearch(""); }}
                className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                style={
                  clientType === t
                    ? { background: "var(--primary)", color: "white", borderColor: "var(--primary)" }
                    : { background: "var(--accent)", color: "var(--foreground)", borderColor: "var(--border-color)" }
                }
              >
                {t === "registered" ? "לקוחה רשומה" : "שם חופשי"}
              </button>
            ))}
          </div>

          {clientType === "registered" ? (
            <>
              <input
                type="text"
                placeholder="חיפוש לפי שם / טלפון"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border mb-2 text-sm"
                style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
              />
              <div
                className="max-h-44 overflow-y-auto flex flex-col gap-1 rounded-xl border"
                style={{ borderColor: "var(--border-color)" }}
              >
                {filteredClients.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>
                    אין לקוחות
                  </p>
                ) : (
                  filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClientId(c.id)}
                      className="flex items-center justify-between px-4 py-2.5 text-sm transition-all"
                      style={{
                        background:
                          selectedClientId === c.id ? "var(--primary)" : "var(--surface)",
                        color: selectedClientId === c.id ? "white" : "var(--foreground)",
                      }}
                    >
                      <span className="font-medium">{c.name}</span>
                      <span
                        className="text-xs"
                        style={{
                          color: selectedClientId === c.id ? "rgba(255,255,255,0.8)" : "var(--muted-foreground)",
                        }}
                      >
                        {c.phone}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="שם לקוחה *"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
              />
              <input
                type="tel"
                placeholder="מספר טלפון (אופציונלי)"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
              />
            </div>
          )}
        </div>

        {/* ── Service ──────────────────────────────────────────── */}
        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
            שירות
          </p>
          <div className="flex flex-col gap-2">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm"
                style={{
                  borderColor: serviceId === s.id ? "var(--primary)" : "var(--border-color)",
                  background:  serviceId === s.id ? "var(--primary)" : "var(--accent)",
                  color:       serviceId === s.id ? "white" : "var(--foreground)",
                }}
              >
                <span className="font-medium">{s.name}</span>
                <span
                  className="text-xs"
                  style={{ color: serviceId === s.id ? "rgba(255,255,255,0.8)" : "var(--muted-foreground)" }}
                >
                  {s.duration} דק׳
                  {s.price ? ` · ₪${s.price}` : ""}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Date & Time ──────────────────────────────────────── */}
        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
            תאריך ושעה
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
                תאריך
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
                שעת התחלה
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
              />
            </div>
          </div>
          {selectedService && date && startTime && (
            <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
              סיום:&nbsp;
              {new Date(
                new Date(`${date}T${startTime}`).getTime() + selectedService.duration * 60_000
              ).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        {/* ── Notes ────────────────────────────────────────────── */}
        <textarea
          placeholder="הערות (אופציונלי)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-2xl border text-sm resize-none"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        />

        {/* ── Submit ───────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={
            saving ||
            !selectedService ||
            !date ||
            !startTime ||
            (clientType === "registered" && !selectedClientId) ||
            (clientType === "custom" && !customName.trim())
          }
          className="w-full py-4 rounded-2xl font-semibold text-white text-base disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {saving ? "שומר..." : "✓ הוסף תור (מאושר)"}
        </button>
      </form>
    </div>
  );
}
