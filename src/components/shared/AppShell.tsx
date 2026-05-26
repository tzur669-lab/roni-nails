"use client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "./Navbar";
import { PhoneInput } from "./PhoneInput";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, appUser, needsPhone, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-4xl animate-pulse">💅</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pb-8">{children}</main>
      {needsPhone && user && (
        <PhoneInput uid={user.uid} onDone={() => window.location.reload()} />
      )}
    </>
  );
}
