import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Service } from "@/types";

const COL = "services";

export async function getServices(activeOnly = false): Promise<Service[]> {
  let q = activeOnly
    ? query(collection(db, COL), where("active", "==", true), orderBy("order"))
    : query(collection(db, COL), orderBy("order"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Service);
}

export async function addService(
  data: Omit<Service, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateService(
  id: string,
  data: Partial<Omit<Service, "id">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteService(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
