import { Timestamp } from "firebase/firestore";
import type { AvailabilityRule, BlockedTime, TimeSlot } from "@/types";

const SLOT_INTERVAL_MINUTES = 5;

export function generateTimeSlots(
  date: Date,
  serviceDuration: number,
  rules: AvailabilityRule[],
  blockedTimes: BlockedTime[],
  existingSlots: Array<{ start: Date; end: Date }>
): TimeSlot[] {
  const dayOfWeek = date.getDay();

  const oneTimeRule = rules.find(
    (r) =>
      r.type === "one_time" &&
      r.date &&
      isSameDay(r.date.toDate(), date)
  );
  const recurringRule = rules.find(
    (r) => r.type === "recurring" && r.dayOfWeek === dayOfWeek
  );

  const rule = oneTimeRule ?? recurringRule;

  if (!rule || !rule.isOpen) return [];

  const [openH, openM] = rule.openTime.split(":").map(Number);
  const [closeH, closeM] = rule.closeTime.split(":").map(Number);

  const slots: TimeSlot[] = [];
  const current = new Date(date);
  current.setHours(openH, openM, 0, 0);

  const closeTime = new Date(date);
  closeTime.setHours(closeH, closeM, 0, 0);

  while (true) {
    const slotEnd = new Date(current.getTime() + serviceDuration * 60_000);
    if (slotEnd > closeTime) break;

    const available =
      !isBlocked(current, slotEnd, blockedTimes) &&
      !hasOverlap(current, slotEnd, existingSlots);

    slots.push({
      startTime: new Date(current),
      endTime: new Date(slotEnd),
      available,
    });

    current.setMinutes(current.getMinutes() + SLOT_INTERVAL_MINUTES);
  }

  return slots;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBlocked(
  start: Date,
  end: Date,
  blockedTimes: BlockedTime[]
): boolean {
  return blockedTimes.some((bt) => {
    if (bt.isAllDay) return true;
    const [bStartH, bStartM] = bt.startTime.split(":").map(Number);
    const [bEndH, bEndM] = bt.endTime.split(":").map(Number);
    const bStart = new Date(start);
    bStart.setHours(bStartH, bStartM, 0, 0);
    const bEnd = new Date(start);
    bEnd.setHours(bEndH, bEndM, 0, 0);
    return start < bEnd && end > bStart;
  });
}

function hasOverlap(
  start: Date,
  end: Date,
  existingSlots: Array<{ start: Date; end: Date }>
): boolean {
  return existingSlots.some((s) => start < s.end && end > s.start);
}

export function appointmentToSlot(appt: {
  startTime: Timestamp;
  endTime: Timestamp;
}): { start: Date; end: Date } {
  return {
    start: appt.startTime.toDate(),
    end: appt.endTime.toDate(),
  };
}
