"use client";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth, ADMIN_UID } from "@/lib/firebase";
import { getUser, createUser } from "@/lib/firestore/users";
import type { AppUser } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const u = await getUser(firebaseUser.uid);
        setAppUser(u);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const u = await getUser(result.user.uid);
    if (!u) {
      await createUser(result.user.uid, {
        name: result.user.displayName ?? "",
        email: result.user.email ?? "",
        phone: "",
        role: result.user.uid === ADMIN_UID ? "admin" : "client",
      });
    }
    return result.user;
  }

  async function signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signUpWithEmail(email: string, password: string, name: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createUser(result.user.uid, {
      name,
      email,
      phone: "",
      role: result.user.uid === ADMIN_UID ? "admin" : "client",
    });
    return result.user;
  }

  async function logout() {
    await signOut(auth);
  }

  const isAdmin = appUser?.role === "admin" || user?.uid === ADMIN_UID;
  const needsPhone = !!user && !!appUser && !appUser.phoneVerified;

  return {
    user,
    appUser,
    loading,
    isAdmin,
    needsPhone,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
  };
}
