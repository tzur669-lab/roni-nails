import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  ClinicSettings,
  PaymentSettings,
  AvailabilityRule,
  BlockedTime,
} from "@/types";

// ── Clinic Settings ──────────────────────────────────────────────
export async function getClinicSettings(): Promise<ClinicSettings | null> {
  const snap = await getDoc(doc(db, "clinicSettings", "main"));
  if (!snap.exists()) return null;
  return snap.data() as ClinicSettings;
}

export async function saveClinicSettings(data: ClinicSettings): Promise<void> {
  await setDoc(doc(db, "clinicSettings", "main"), data);
}

// ── Payment Settings ─────────────────────────────────────────────
export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  const snap = await getDoc(doc(db, "paymentSettings", "main"));
  if (!snap.exists()) return null;
  return snap.data() as PaymentSettings;
}

export async function savePaymentSettings(data: PaymentSettings): Promise<void> {
  await setDoc(doc(db, "paymentSettings", "main"), data);
}

// ── Availability Rules ────────────────────────────────────────────
export async function getAvailabilityRules(): Promise<AvailabilityRule[]> {
  const snap = await getDocs(collection(db, "availabilityRules"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AvailabilityRule);
}

export async function addAvailabilityRule(
  data: Omit<AvailabilityRule, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "availabilityRules"), data);
  return ref.id;
}

export async function updateAvailabilityRule(
  id: string,
  data: Partial<Omit<AvailabilityRule, "id">>
): Promise<void> {
  await updateDoc(doc(db, "availabilityRules", id), data);
}

export async function deleteAvailabilityRule(id: string): Promise<void> {
  await deleteDoc(doc(db, "availabilityRules", id));
}

// ── Blocked Times ─────────────────────────────────────────────────
export async function getBlockedTimes(): Promise<BlockedTime[]> {
  const q = query(collection(db, "blockedTimes"), orderBy("date"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BlockedTime);
}

export async function addBlockedTime(
  data: Omit<BlockedTime, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "blockedTimes"), data);
  return ref.id;
}

export async function deleteBlockedTime(id: string): Promise<void> {
  await deleteDoc(doc(db, "blockedTimes", id));
}

export async function getBlockedTimesForDate(date: Date): Promise<BlockedTime[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  const snap = await getDocs(collection(db, "blockedTimes"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as BlockedTime)
    .filter((bt) => {
      const d = bt.date.toDate();
      return d >= start && d <= end;
    });
}
