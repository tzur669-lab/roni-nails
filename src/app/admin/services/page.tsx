"use client";
import { useEffect, useState } from "react";
import { getServices, addService, updateService, deleteService } from "@/lib/firestore/services";
import type { Service } from "@/types";

const EMPTY: Omit<Service, "id"> = {
  name: "", duration: 60, description: "", price: undefined, active: true, order: 0,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Service, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getServices().then(setServices); }, []);

  function openNew() {
    setEditing(null);
    setShowForm(true);
    setForm({ ...EMPTY, order: services.length });
  }

  function openEdit(s: Service) {
    setEditing(s);
    setShowForm(true);
    setForm({ name: s.name, duration: s.duration, description: s.description ?? "", price: s.price, active: s.active, order: s.order });
  }

  async function save() {
    if (!form.name.trim() || !form.duration) return;
    setSaving(true);
    try {
      if (editing) {
        await updateService(editing.id, form);
        setServices((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...form } : s)));
      } else {
        const id = await addService(form);
        setServices((prev) => [...prev, { id, ...form }]);
      }
      setEditing(null);
      setShowForm(false);
      setForm(EMPTY);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק שירות זה?")) return;
    await deleteService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleActive(s: Service) {
    await updateService(s.id, { active: !s.active });
    setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)));
  }

  return (
    <div className="pb-20 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>שירותים</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          + הוסף שירות
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <ServiceForm
          form={form}
          onChange={setForm}
          onSave={save}
          onCancel={() => { setEditing(null); setShowForm(false); setForm(EMPTY); }}
          saving={saving}
          isEdit={!!editing}
        />
      )}

      {/* List */}
      <div className="flex flex-col gap-3 mt-4">
        {services.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl border flex justify-between items-start"
            style={{ borderColor: "var(--border-color)", background: s.active ? "var(--surface)" : "var(--muted)" }}
          >
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{s.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {s.duration} דק׳{s.price ? ` · ₪${s.price}` : ""}
                {s.description ? ` · ${s.description}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(s)}
                className="text-xs px-2 py-1 rounded-lg border"
                style={{ borderColor: "var(--border-color)", color: s.active ? "#10B981" : "#9CA3AF" }}
              >
                {s.active ? "פעיל" : "לא פעיל"}
              </button>
              <button onClick={() => openEdit(s)} className="text-xs px-2 py-1 rounded-lg" style={{ color: "var(--primary-dark)" }}>
                עריכה
              </button>
              <button onClick={() => handleDelete(s.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: "#EF4444" }}>
                מחק
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceForm({
  form, onChange, onSave, onCancel, saving, isEdit,
}: {
  form: Omit<Service, "id">;
  onChange: (f: Omit<Service, "id">) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function field(key: keyof Omit<Service, "id">, value: string | number | boolean | undefined) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="p-5 rounded-2xl border-2 mb-4" style={{ borderColor: "var(--primary)", background: "var(--surface)" }}>
      <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
        {isEdit ? "עריכת שירות" : "שירות חדש"}
      </h2>
      <div className="flex flex-col gap-3">
        <input
          placeholder="שם השירות *"
          value={form.name}
          onChange={(e) => field("name", e.target.value)}
          className="w-full px-4 py-3 rounded-xl border"
          style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>משך (דקות) *</label>
            <input
              type="number"
              min={15}
              step={15}
              value={form.duration}
              onChange={(e) => field("duration", Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border"
              style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>מחיר (₪)</label>
            <input
              type="number"
              min={0}
              value={form.price ?? ""}
              onChange={(e) => field("price", e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-3 rounded-xl border"
              style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
            />
          </div>
        </div>
        <input
          placeholder="תיאור (אופציונלי)"
          value={form.description ?? ""}
          onChange={(e) => field("description", e.target.value)}
          className="w-full px-4 py-3 rounded-xl border"
          style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
        />
        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {saving ? "שומר..." : "שמור"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border-2 font-medium"
            style={{ borderColor: "var(--border-color)", color: "var(--foreground)" }}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
