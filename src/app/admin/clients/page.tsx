"use client";
import { useEffect, useState } from "react";
import { getAllClients, addClientNote } from "@/lib/firestore/users";
import { getClientAppointments } from "@/lib/firestore/appointments";
import { useAuth } from "@/hooks/useAuth";
import type { AppUser, Appointment } from "@/types";

export default function AdminClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<AppUser[]>([]);
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { getAllClients().then(setClients); }, []);

  async function openClient(c: AppUser) {
    setSelected(c);
    const a = await getClientAppointments(c.id);
    setAppts(a);
  }

  async function saveNote() {
    if (!note.trim() || !selected || !user) return;
    setSaving(true);
    await addClientNote(selected.id, note.trim(), user.uid);
    setNote("");
    setSaving(false);
  }

  return (
    <div className="pb-20 md:pb-6">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>לקוחות</h1>

      {selected ? (
        <div>
          <button onClick={() => setSelected(null)} className="text-sm mb-4 flex items-center gap-1" style={{ color: "var(--primary-dark)" }}>
            ← חזרה לרשימה
          </button>
          <div className="p-5 rounded-2xl border mb-4" style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}>
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>{selected.name}</p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{selected.phone}</p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{selected.email}</p>
          </div>

          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>תורים</h2>
          <div className="flex flex-col gap-2 mb-6">
            {appts.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>אין תורים</p>
            ) : (
              appts.map((a) => (
                <div key={a.id} className="p-3 rounded-xl border text-sm" style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--foreground)" }}>{a.serviceName}</span>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      {a.startTime.toDate().toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>הוסף הערה</h2>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="הערה על הלקוחה..."
              className="flex-1 px-4 py-3 rounded-xl border"
              style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
            />
            <button
              onClick={saveNote}
              disabled={saving || !note.trim()}
              className="px-4 py-3 rounded-xl font-semibold text-white disabled:opacity-60"
              style={{ background: "var(--primary)" }}
            >
              {saving ? "..." : "שמור"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {clients.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: "var(--muted-foreground)" }}>אין לקוחות רשומים</p>
          ) : (
            clients.map((c) => (
              <button
                key={c.id}
                onClick={() => openClient(c)}
                className="flex justify-between items-center p-4 rounded-2xl border text-right w-full transition-all hover:shadow-sm"
                style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
              >
                <div>
                  <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{c.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.phone}</p>
                </div>
                <span style={{ color: "var(--muted-foreground)" }}>←</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
