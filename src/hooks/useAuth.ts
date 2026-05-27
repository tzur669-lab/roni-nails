"use client";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
    // Handle redirect result in case popup was blocked and redirect was used as fallback
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const u = await getUser(result.user.uid);
          if (!u) {
            await createUser(result.user.uid, {
              name: result.user.displayName ?? "",
              email: result.user.email ?? "",
              phone: "",
              role: result.user.uid === ADMIN_UID ? "admin" : "client",
            }).catch(console.error);
          }
        }
      })
      .catch(console.error);

    // Main auth state listener
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let u = await getUser(firebaseUser.uid);
        if (!u) {
          // Firestore doc missing — create it (happens if signup Firestore write failed)
          await createUser(firebaseUser.uid, {
            name: firebaseUser.displayName ?? "",
            email: firebaseUser.email ?? "",
            phone: "",
            role: firebaseUser.uid === ADMIN_UID ? "admin" : "client",
          }).catch(console.error);
          u = await getUser(firebaseUser.uid);
        }
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
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      // Try popup first — instant, no page reload
      const result = await signInWithPopup(auth, provider);
      const u = await getUser(result.user.uid);
      if (!u) {
        await createUser(result.user.uid, {
          name: result.user.displayName ?? "",
          email: result.user.email ?? "",
          phone: "",
          role: result.user.uid === ADMIN_UID ? "admin" : "client",
        }).catch(console.error);
      }
      return result.user;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-blocked" || code === "auth/popup-cancelled-by-user") {
        // Popup was blocked — fall back to redirect
        await signInWithRedirect(auth, provider);
        return; // page navigates away
      }
      throw err;
    }
  }

  async function signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signUpWithEmail(email: string, password: string, name: string) {
    // Email is optional — if empty, generate a placeholder for Firebase Auth only
    const authEmail = email.trim() || `noemail_${Date.now()}@placeholder.com`;
    const result = await createUserWithEmailAndPassword(auth, authEmail, password);
    try {
      await createUser(result.user.uid, {
        name,
        email: email.trim() || "", // store "" in Firestore when no email given
        phone: "",
        role: result.user.uid === ADMIN_UID ? "admin" : "client",
      });
    } catch (err) {
      // Auth user created successfully — Firestore doc will be created on next load
      console.error("Firestore createUser failed after signup:", err);
    }
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
