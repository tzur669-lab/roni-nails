"use client";
import type { TimeSlot } from "@/types";

interface Props {
  slots: TimeSlot[];
  selectedStart: Date | null;
  onSelect: (start: Date, end: Date) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function TimeSlotPicker({ slots, selectedStart, onSelect }: Props) {
  if (slots.length === 0) {
    return (
      <p className="text-center py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>
        אין זמנות פנויות ביום זה
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((slot, i) => {
        const isSelected = selectedStart?.getTime() === slot.startTime.getTime();
        return (
          <button
            key={i}
            disabled={!slot.available}
            onClick={() => onSelect(slot.startTime, slot.endTime)}
            className="py-2.5 rounded-2xl text-sm font-medium transition-all border-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            style={{
              borderColor: isSelected ? "var(--primary)" : "var(--border-color)",
              background: isSelected
                ? "var(--primary)"
                : slot.available
                ? "var(--surface)"
                : "var(--muted)",
              color: isSelected ? "white" : "var(--foreground)",
            }}
          >
            {formatTime(slot.startTime)}
          </button>
        );
      })}
    </div>
  );
}
