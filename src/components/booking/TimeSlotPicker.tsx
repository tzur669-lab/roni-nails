"use client";
import type { TimeSlot } from "@/types";

interface Props {
  slots: TimeSlot[];
  selectedStart: Date | null;
  onSelect: (start: Date, end: Date) => void;
  slotOffset: number;
  onToggleOffset: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function TimeSlotPicker({ slots, selectedStart, onSelect, slotOffset, onToggleOffset }: Props) {
  if (slots.length === 0) {
    return (
      <p className="text-center py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>
        אין זמנות פנויות ביום זה
      </p>
    );
  }

  return (
    <div>
      {/* Toggle: :00/:10 or :05/:15 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => slotOffset !== 0 && onToggleOffset()}
          className="flex-1 py-2 rounded-2xl text-sm font-medium border-2 transition-all"
          style={{
            borderColor: slotOffset === 0 ? "var(--primary)" : "var(--border-color)",
            background: slotOffset === 0 ? "var(--primary)" : "var(--surface)",
            color: slotOffset === 0 ? "white" : "var(--muted-foreground)",
          }}
        >
          :00 · :10 · :20...
        </button>
        <button
          onClick={() => slotOffset !== 5 && onToggleOffset()}
          className="flex-1 py-2 rounded-2xl text-sm font-medium border-2 transition-all"
          style={{
            borderColor: slotOffset === 5 ? "var(--primary)" : "var(--border-color)",
            background: slotOffset === 5 ? "var(--primary)" : "var(--surface)",
            color: slotOffset === 5 ? "white" : "var(--muted-foreground)",
          }}
        >
          :05 · :15 · :25...
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot, i) => {
          const isSelected =
            selectedStart?.getTime() === slot.startTime.getTime();
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
    </div>
  );
}
