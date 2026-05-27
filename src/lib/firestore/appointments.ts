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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Appointment, AppointmentStatus } from "@/types";

const COL = "appointments";

export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Appointment;
}

export async function getClientAppointments(clientId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, COL),
    where("clientId", "==", clientId),
    orderBy("startTime", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const q = query(collection(db, COL), orderBy("startTime", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
}

export async function getTodayAppointments(): Promise<Appointment[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const q = query(
    collection(db, COL),
    where("startTime", ">=", Timestamp.fromDate(start)),
    where("startTime", "<=", Timestamp.fromDate(end)),
    orderBy("startTime")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  await updateDoc(doc(db, COL, id), { status, updatedAt: serverTimestamp() });
}

export async function requestAppointmentChange(
  id: string,
  newStart: Date,
  newEnd: Date
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "change_requested",
    changeRequest: {
      requestedStartTime: Timestamp.fromDate(newStart),
      requestedEndTime: Timestamp.fromDate(newEnd),
      requestedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}

export async function cancelAppointment(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "cancelled",
    updatedAt: serverTimestamp(),
  });
}

// Check overlapping appointments for a given time range
export async function checkOverlap(
  startTime: Date,
  endTime: Date,
  excludeId?: string
): Promise<boolean> {
  const q = query(
    collection(db, COL),
    where("status", "in", ["pending", "approved"]),
    where("startTime", "<", Timestamp.fromDate(endTime)),
    where("endTime", ">", Timestamp.fromDate(startTime))
  );
  const snap = await getDocs(q);
  const docs = snap.docs.filter((d) => d.id !== excludeId);
  return docs.length > 0;
}

export async function getUpcomingAppointments(): Promise<Appointment[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const q = query(
    collection(db, COL),
    where("startTime", ">=", Timestamp.fromDate(tomorrow)),
    orderBy("startTime")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Appointment)
    .filter((a) => a.status === "pending" || a.status === "approved");
}

export function subscribeToAppointments(
  callback: (appointments: Appointment[]) => void
) {
  const q = query(collection(db, COL), orderBy("startTime", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment));
  });
}
