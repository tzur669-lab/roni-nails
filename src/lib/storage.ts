import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadClinicPhoto(file: File): Promise<string> {
  const storageRef = ref(storage, `clinic/home-photo-${Date.now()}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
