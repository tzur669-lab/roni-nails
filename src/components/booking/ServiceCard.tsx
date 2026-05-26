"use client";
import type { Service } from "@/types";

interface Props {
  service: Service;
  selected?: boolean;
  onSelect: (service: Service) => void;
}

export function ServiceCard({ service, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(service)}
      className="w-full text-right p-5 rounded-2xl border-2 transition-all hover:shadow-md active:scale-95"
      style={{
        borderColor: selected ? "var(--primary)" : "var(--border-color)",
        background: selected ? "var(--accent)" : "var(--surface)",
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            {service.name}
          </h3>
          {service.description && (
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {service.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
              ⏱ {service.duration} דק׳
            </span>
            {service.price && (
              <span className="text-sm font-medium" style={{ color: "var(--primary-dark)" }}>
                ₪{service.price}
              </span>
            )}
          </div>
        </div>
        {selected && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
            style={{ background: "var(--primary)" }}
          >
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
    </button>
  );
}
