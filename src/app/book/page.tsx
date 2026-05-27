"use client";
import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useBookingStore } from "@/store/bookingStore";
import { getServices } from "@/lib/firestore/services";
import { getAllAppointments, createAppointment } from "@/lib/firestore/appointments";
import { getAvailabilityRules, getBlockedTimesForDate } from "@/lib/firestore/settings";
import { generateTimeSlots, appointmentToSlot } from "@/lib/booking-logic";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { GuestForm } from "@/components/booking/GuestForm";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { AppShell } from "@/components/shared/AppShell";
import type { Service, TimeSlot } from "@/types";

// ─── Calendar helpers ──────────────────────────────────────────────
const MONTHS_HE = [
  "ינואר","פברואר","מרץ","אפריל","מאי","יוני",
  "יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר",
];
const DAY_HEADERS = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];

/** Returns an array of 42 cells (6 weeks × 7 days).
 *  Cells before the 1st of the month and after the last day are null. */
function buildCalendarCells(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Page ─────────────────────────────────────────────────────────
export default function BookPage() {
  const { user, appUser } = useAuth();
  const store = useBookingStore();

  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Calendar navigation state
  const todayMidnight = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const minDate = new Date(todayMidnight); minDate.setDate(minDate.getDate() + 1); // from tomorrow
  const maxDate = new Date(todayMidnight); maxDate.setDate(maxDate.getDate() + 60);

  const [calYear,  setCalYear]  = useState(minDate.getFullYear());
  const [calMonth, setCalMonth] = useState(minDate.getMonth());

  useEffect(() => {
    getServices(true).then(setServices).catch(console.error);
  }, []);

  // Load time slots whenever service + date change
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
        existing
      );
      setSlots(generated);
      setLoadingSlots(false);
    }).catch(() => { setSlots([]); setLoadingSlots(false); });
  }, [store.selectedService, store.selectedDate]);

  async function submit(guestInfo?: { name: string; phone: string }) {
    if (!store.selectedService || !store.selectedStartTime || !store.selectedEndTime) return;
    setSubmitting(true);
    try {
      const clientId   = user?.uid ?? "guest";
      const clientName = appUser?.name  ?? guestInfo?.name  ?? "";
      const clientPhone= appUser?.phone ?? guestInfo?.phone ?? "";

      await createAppointment({
        clientId,
        clientName,
        clientPhone,
        serviceId:       store.selectedService.id,
        serviceName:     store.selectedService.name,
        serviceDuration: store.selectedService.duration,
        startTime: Timestamp.fromDate(store.selectedStartTime),
        endTime:   Timestamp.fromDate(store.selectedEndTime),
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

  // ── Confirmation screen ──────────────────────────────────────────
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

  // ── Calendar month nav ───────────────────────────────────────────
  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }
  const lastDayOfPrevMonth = new Date(calYear, calMonth, 0);
  const firstDayOfNextMonth = new Date(calYear, calMonth + 1, 1);
  const canPrev = lastDayOfPrevMonth >= minDate;
  const canNext = firstDayOfNextMonth <= maxDate;

  const calCells = buildCalendarCells(calYear, calMonth);

  // ── Main render ──────────────────────────────────────────────────
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
                style={{
                  background:
                    store.step > i + 1
                      ? "var(--primary-dark)"
                      : store.step === i + 1
                      ? "var(--primary)"
                      : "var(--border-color)",
                }}
              />
              <span
                className="text-xs"
                style={{
                  color:
                    store.step === i + 1
                      ? "var(--primary-dark)"
                      : "var(--muted-foreground)",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Step 1 — Service ──────────────────────────────────── */}
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

        {/* ── Step 2 — Date + Time ──────────────────────────────── */}
        {store.step === 2 && store.selectedService && (
          <div>
            <button
              onClick={() => store.setStep(1)}
              className="text-sm mb-5 flex items-center gap-1"
              style={{ color: "var(--primary-dark)" }}
            >
              ← חזרה
            </button>

            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              בחרי תאריך
            </h2>

            {/* Month navigation */}
            <div
              className="flex items-center justify-between mb-3"
              dir="ltr"
            >
              <button
                onClick={prevMonth}
                disabled={!canPrev}
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg disabled:opacity-25 transition-opacity"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-color)",
                  color: "var(--foreground)",
                }}
              >
                ‹
              </button>
              <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                {MONTHS_HE[calMonth]} {calYear}
              </span>
              <button
                onClick={nextMonth}
                disabled={!canNext}
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg disabled:opacity-25 transition-opacity"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-color)",
                  color: "var(--foreground)",
                }}
              >
                ›
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs py-1 font-semibold"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              className="grid grid-cols-7 gap-y-1 mb-6 p-3 rounded-2xl border"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--surface)",
              }}
            >
              {calCells.map((day, i) => {
                if (!day) return <div key={i} />;

                const isPast    = day < minDate;
                const isFuture  = day > maxDate;
                const disabled  = isPast || isFuture;
                const selected  = store.selectedDate?.toDateString() === day.toDateString();
                const isToday   = day.toDateString() === todayMidnight.toDateString();

                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => store.setDate(new Date(day))}
                    className="aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all mx-0.5 disabled:opacity-25 disabled:cursor-not-allowed active:scale-95"
                    style={{
                      background: selected
                        ? "var(--primary)"
                        : isToday
                        ? "var(--accent)"
                        : "transparent",
                      color: selected
                        ? "white"
                        : isToday
                        ? "var(--primary-dark)"
                        : "var(--foreground)",
                      border: selected
                        ? "none"
                        : isToday
                        ? "1.5px solid var(--primary)"
                        : "none",
                      fontWeight: selected ? 700 : isToday ? 600 : 400,
                    }}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Time slots */}
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
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 3 — Confirm ─────────────────────────────────── */}
        {store.step === 3 &&
          store.selectedService &&
          store.selectedStartTime &&
          store.selectedEndTime && (
          <div>
            <button
              onClick={() => store.setStep(2)}
              className="text-sm mb-4 flex items-center gap-1"
              style={{ color: "var(--primary-dark)" }}
            >
              ← חזרה
            </button>

            {/* Summary */}
            <div
              className="p-5 rounded-2xl mb-5"
              style={{ background: "var(--accent)" }}
            >
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>שירות</span>
                  <span className="font-semibold">{store.selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>תאריך</span>
                  <span className="font-semibold">
                    {store.selectedStartTime.toLocaleDateString("he-IL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>שעה</span>
                  <span className="font-semibold">
                    {store.selectedStartTime.toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
