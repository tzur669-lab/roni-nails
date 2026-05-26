import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db, ADMIN_UID } from "@/lib/firebase";
import type { AppUser } from "@/types";

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AppUser;
}

export async function createUser(
  uid: string,
  data: Omit<AppUser, "id" | "createdAt" | "phoneVerified">
): Promise<void> {
  const role = uid === ADMIN_UID ? "admin" : "client";
  await setDoc(doc(db, "users", uid), {
    ...data,
    role,
    createdAt: serverTimestamp(),
    phoneVerified: false,
  });
}

export async function updateUserPhone(uid: string, phone: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { phone, phoneVerified: true });
}

export async function getAllClients(): Promise<AppUser[]> {
  const q = query(collection(db, "users"), where("role", "==", "client"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppUser);
}

export async function addClientNote(
  clientId: string,
  note: string,
  adminId: string
): Promise<void> {
  const ref = doc(collection(db, "clientNotes"));
  await setDoc(ref, {
    clientId,
    note,
    createdAt: serverTimestamp(),
    updatedBy: adminId,
  });
}
