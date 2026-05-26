"use client";
import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useBookingStore } from "@/store/bookingStore";
import { getServices } from "@/lib/firestore/services";
import { getAllAppointments, createAppointment, checkOverlap } from "@/lib/firestore/appointments";
import { getAvailabilityRules, getBlockedTimesForDate } from "@/lib/firestore/settings";
import { generateTimeSlots, appointmentToSlot } from "@/lib/booking-logic";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { GuestForm } from "@/components/booking/GuestForm";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { AppShell } from "@/components/shared/AppShell";
import type { Service, TimeSlot } from "@/types";

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function getNextDays(n: number): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

export default function BookPage() {
  const { user, appUser } = useAuth();
  const store = useBookingStore();

  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [slotOffset, setSlotOffset] = useState(0);

  const days = getNextDays(45);

  useEffect(() => {
    getServices(true).then(setServices).catch(console.error);
  }, []);

  useEffect(() => {
    if (!store.selectedService || !store.selectedDate) return;
    setLoadingSlots(true);
    Promise.all([
      getAvailabilityRules(),
      getBlockedTimesForDate(store.selectedDate),
      getAllAppointments(),
    ]).then(([rules, blocked, appts]) => {
      const existing = appts
        .filter((a) => a.status === "pending" || a.status === "approved")
        .map(appointmentToSlot);
      const generated = generateTimeSlots(
        store.selectedDate!,
        store.selectedService!.duration,
        rules,
        blocked,
        existing,
        slotOffset
      );
      setSlots(generated);
      setLoadingSlots(false);
    });
  }, [store.selectedService, store.selectedDate, slotOffset]);

  async function submit(guestInfo?: { name: string; phone: string }) {
    if (!store.selectedService || !store.selectedStartTime || !store.selectedEndTime) return;
    setSubmitting(true);
    try {
      const overlap = await checkOverlap(store.selectedStartTime, store.selectedEndTime);
      if (overlap) { alert("הזמן שנבחר כבר תפוס. אנא בחרי שעה אחרת."); setSubmitting(false); return; }

      const clientId = user?.uid ?? "guest";
      const clientName = appUser?.name ?? guestInfo?.name ?? "";
      const clientPhone = appUser?.phone ?? guestInfo?.phone ?? "";

      await createAppointment({
        clientId,
        clientName,
        clientPhone,
        serviceId: store.selectedService.id,
        serviceName: store.selectedService.name,
        serviceDuration: store.selectedService.duration,
        startTime: Timestamp.fromDate(store.selectedStartTime),
        endTime: Timestamp.fromDate(store.selectedEndTime),
        status: "pending",
        isGuest: !user,
      });
      setDone(true);
    } catch {
      alert("שגיאה בשליחת הבקשה. נסי שוב.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done && store.selectedService && store.selectedStartTime && store.selectedEndTime) {
    const clientName = appUser?.name ?? store.guestInfo?.name ?? "";
    return (
      <AppShell>
        <div className="pt-6">
          <BookingConfirmation
            service={store.selectedService}
            startTime={store.selectedStartTime}
            endTime={store.selectedEndTime}
            clientName={clientName}
          />
          <button
            onClick={() => { store.reset(); setDone(false); }}
            className="w-full mt-4 py-3 rounded-2xl font-medium border-2 transition-all"
            style={{ borderColor: "var(--primary)", color: "var(--primary-dark)" }}
          >
            הזמן תור נוסף
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-6 pb-10">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
          הזמנת תור
        </h1>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {["שירות", "מועד", "אישור"].map((label, i) => (
            <div key={i} className="flex-1 text-center">
              <div
                className="h-1.5 rounded-full mb-1 transition-all"
                style={{ background: store.step > i + 1 ? "var(--primary-dark)" : store.step === i + 1 ? "var(--primary)" : "var(--border-color)" }}
              />
              <span className="text-xs" style={{ color: store.step === i + 1 ? "var(--primary-dark)" : "var(--muted-foreground)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1 — Service */}
        {store.step === 1 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              איזה שירות תרצי?
            </h2>
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                selected={store.selectedService?.id === s.id}
                onSelect={store.setService}
              />
            ))}
          </div>
        )}

        {/* Step 2 — Date + Time */}
        {store.step === 2 && store.selectedService && (
          <div>
            <button
              onClick={() => store.setStep(1)}
              className="text-sm mb-4 flex items-center gap-1"
              style={{ color: "var(--primary-dark)" }}
            >
              ← חזרה
            </button>
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              בחרי תאריך
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
              {days.map((day, i) => {
                const selected = store.selectedDate?.toDateString() === day.toDateString();
                return (
                  <button
                    key={i}
                    onClick={() => store.setDate(day)}
                    className="flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: selected ? "var(--primary)" : "var(--border-color)",
                      background: selected ? "var(--accent)" : "var(--surface)",
                      minWidth: 60,
                    }}
                  >
                    <span className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                      {DAYS_HE[day.getDay()]}
                    </span>
                    <span className="text-lg font-bold" style={{ color: selected ? "var(--primary-dark)" : "var(--foreground)" }}>
                      {day.getDate()}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {day.toLocaleDateString("he-IL", { month: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>

            {store.selectedDate && (
              <>
                <h2 className="text-base font-semibold mb-4" style={{ color: "var(--foreground)" }}>
                  בחרי שעה
                </h2>
                {loadingSlots ? (
                  <p className="text-center py-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
                    טוענת...
                  </p>
                ) : (
                  <TimeSlotPicker
                    slots={slots}
                    selectedStart={store.selectedStartTime}
                    onSelect={store.setTimeSlot}
                    slotOffset={slotOffset}
                    onToggleOffset={() => setSlotOffset((prev) => (prev === 0 ? 5 : 0))}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3 — Confirm */}
        {store.step === 3 && store.selectedService && store.selectedStartTime && store.selectedEndTime && (
          <div>
            <button
              onClick={() => store.setStep(2)}
              className="text-sm mb-4 flex items-center gap-1"
              style={{ color: "var(--primary-dark)" }}
            >
              ← חזרה
            </button>

            {/* Summary */}
            <div className="p-5 rounded-2xl mb-5" style={{ background: "var(--accent)" }}>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>שירות</span>
                  <span className="font-semibold">{store.selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>תאריך</span>
                  <span className="font-semibold">
                    {store.selectedStartTime.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>שעה</span>
                  <span className="font-semibold">
                    {store.selectedStartTime.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>

            {user ? (
              <button
                onClick={() => submit()}
                disabled={submitting}
                className="w-full py-4 rounded-2xl font-semibold text-white text-base disabled:opacity-60"
                style={{ background: "var(--primary)" }}
              >
                {submitting ? "שולח בקשה..." : "שלח בקשת תור"}
              </button>
            ) : (
              <GuestForm onSubmit={submit} loading={submitting} />
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
