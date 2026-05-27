import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Appointment, AppointmentStatus } from "@/types";

// ─── Four collections by status ────────────────────────────────────────────
const COLL_PENDING   = "appointmentsPending";    // pending, change_requested
const COLL_APPROVED  = "appointmentsApproved";   // approved (future)
const COLL_REJECTED  = "appointmentsRejected";   // rejected, cancelled
const COLL_COMPLETED = "appointmentsCompleted";  // completed (past)
const ALL_COLLS      = [COLL_PENDING, COLL_APPROVED, COLL_REJECTED, COLL_COMPLETED] as const;

function collectionForStatus(status: AppointmentStatus): string {
  if (status === "approved")                          return COLL_APPROVED;
  if (status === "completed")                         return COLL_COMPLETED;
  if (status === "rejected" || status === "cancelled") return COLL_REJECTED;
  return COLL_PENDING; // pending, change_requested
}

/**
 * Runs a getDocs query and swallows permission / network errors.
 * Returns an empty array on failure so multi-collection reads degrade
 * gracefully instead of rejecting the whole Promise.all.
 */
async function safeDocs(q: ReturnType<typeof query>): Promise<Appointment[]> {
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()) as Appointment);
  } catch (err) {
    console.warn("[appointments] query failed, skipping collection:", err);
    return [];
  }
}

/** Search all collections to find which one holds an appointment. */
async function findCollection(
  id: string
): Promise<{ coll: string; data: Record<string, unknown> } | null> {
  for (const coll of ALL_COLLS) {
    const s = await getDoc(doc(db, coll, id));
    if (s.exists()) return { coll, data: s.data() as Record<string, unknown> };
  }
  return null;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COLL_PENDING), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  for (const coll of ALL_COLLS) {
    const snap = await getDoc(doc(db, coll, id));
    if (snap.exists()) return { id: snap.id, ...snap.data() } as Appointment;
  }
  return null;
}

export async function getClientAppointments(clientId: string): Promise<Appointment[]> {
  const results = await Promise.all(
    ALL_COLLS.map((coll) =>
      safeDocs(query(collection(db, coll), where("clientId", "==", clientId)))
    )
  );
  return results
    .flat()
    .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const results = await Promise.all(
    ALL_COLLS.map((coll) =>
      safeDocs(query(collection(db, coll), orderBy("startTime", "desc")))
    )
  );
  return results
    .flat()
    .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
}

/**
 * Returns only pending + approved appointments — the two collections that
 * affect slot availability. Used by the public booking page (including guests)
 * so it must not query collections that require auth.
 */
export async function getActiveAppointmentsForSlots(): Promise<Appointment[]> {
  const results = await Promise.all(
    [COLL_PENDING, COLL_APPROVED].map((coll) =>
      safeDocs(query(collection(db, coll), orderBy("startTime", "desc")))
    )
  );
  return results
    .flat()
    .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
}

export async function getTodayAppointments(): Promise<Appointment[]> {
  const start = new Date(); start.setHours(0,  0,  0,   0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  const results = await Promise.all(
    [COLL_PENDING, COLL_APPROVED, COLL_COMPLETED].map((coll) =>
      safeDocs(
        query(
          collection(db, coll),
          where("startTime", ">=", Timestamp.fromDate(start)),
          where("startTime", "<=", Timestamp.fromDate(end)),
          orderBy("startTime")
        )
      )
    )
  );
  return results
    .flat()
    .sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis());
}

export async function updateAppointmentStatus(
  id: string,
  newStatus: AppointmentStatus
): Promise<void> {
  const found = await findCollection(id);
  if (!found) throw new Error(`Appointment ${id} not found in any collection`);

  const targetColl = collectionForStatus(newStatus);

  if (found.coll === targetColl) {
    // Same collection — just update the field
    await updateDoc(doc(db, found.coll, id), {
      status:    newStatus,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Different collection — move the document atomically
    const batch = writeBatch(db);
    batch.set(doc(db, targetColl, id), {
      ...found.data,
      status:    newStatus,
      updatedAt: serverTimestamp(),
    });
    batch.delete(doc(db, found.coll, id));
    await batch.commit();
  }
}

export async function requestAppointmentChange(
  id: string,
  newStart: Date,
  newEnd: Date
): Promise<void> {
  // change_requested stays in PENDING collection
  const found = await findCollection(id);
  if (!found) return;
  await updateDoc(doc(db, found.coll, id), {
    status: "change_requested",
    changeRequest: {
      requestedStartTime: Timestamp.fromDate(newStart),
      requestedEndTime:   Timestamp.fromDate(newEnd),
      requestedAt:        serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}

export async function cancelAppointment(id: string): Promise<void> {
  return updateAppointmentStatus(id, "cancelled");
}

export async function getUpcomingAppointments(): Promise<Appointment[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const results = await Promise.all(
    [COLL_PENDING, COLL_APPROVED].map((coll) =>
      safeDocs(
        query(
          collection(db, coll),
          where("startTime", ">=", Timestamp.fromDate(tomorrow)),
          orderBy("startTime")
        )
      )
    )
  );
  return results
    .flat()
    .sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis());
}

/** Real-time subscription across all collections. */
export function subscribeToAppointments(
  callback: (appointments: Appointment[]) => void
): () => void {
  const buckets = new Map<string, Map<string, Appointment>>(
    ALL_COLLS.map((c) => [c, new Map()])
  );

  function emit() {
    const all = Array.from(buckets.values())
      .flatMap((m) => Array.from(m.values()))
      .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
    callback(all);
  }

  const unsubs = ALL_COLLS.map((coll) =>
    onSnapshot(
      query(collection(db, coll), orderBy("startTime", "desc")),
      (snap) => {
        const map = buckets.get(coll)!;
        map.clear();
        snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as Appointment));
        emit();
      },
      (err) => {
        console.warn(`[appointments] snapshot on '${coll}' failed:`, err);
      }
    )
  );

  return () => unsubs.forEach((u) => u());
}

/**
 * Finds all approved appointments whose endTime has already passed,
 * moves them to appointmentsCompleted, and deletes from appointmentsApproved.
 * Safe to call repeatedly. Returns the number of appointments moved.
 */
export async function markPastAppointmentsAsCompleted(): Promise<number> {
  const now = Timestamp.now();
  const snap = await getDocs(
    query(collection(db, COLL_APPROVED), where("endTime", "<=", now))
  );
  const docsToMove = snap.docs.filter((d) => d.data().status === "approved");
  if (docsToMove.length === 0) return 0;

  const batch = writeBatch(db);
  docsToMove.forEach((d) => {
    batch.set(doc(db, COLL_COMPLETED, d.id), {
      ...d.data(),
      status: "completed",
      updatedAt: serverTimestamp(),
    });
    batch.delete(doc(db, COLL_APPROVED, d.id));
  });
  await batch.commit();
  return docsToMove.length;
}

/**
 * Creates an appointment directly in the correct collection based on its status.
 * Used by admin to manually add appointments (e.g. "approved" → COLL_APPROVED).
 */
export async function createAdminAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const coll = collectionForStatus(data.status);
  const ref = await addDoc(collection(db, coll), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * One-time migration: moves all documents from the old flat `appointments`
 * collection to the correct new collection based on their status.
 */
export async function migrateFromLegacyCollection(): Promise<number> {
  const snap = await getDocs(collection(db, "appointments"));
  if (snap.empty) return 0;

  let count = 0;
  const batch = writeBatch(db);

  for (const d of snap.docs) {
    const data   = d.data() as Omit<Appointment, "id">;
    const status = (data.status ?? "pending") as AppointmentStatus;
    const target = collectionForStatus(status);

    batch.set(doc(db, target, d.id), data);
    batch.delete(doc(db, "appointments", d.id));
    count++;

    if (count % 200 === 0) await batch.commit();
  }

  if (count % 200 !== 0) await batch.commit();
  return count;
}

/** Check if the legacy `appointments` collection still has documents. */
export async function hasLegacyAppointments(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, "appointments"));
    return !snap.empty;
  } catch {
    return false;
  }
}
