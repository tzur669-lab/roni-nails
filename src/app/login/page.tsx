"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (e: unknown) {
      setError("שגיאה בהתחברות עם Google");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      router.push("/");
    } catch (e: unknown) {
      setError(mode === "login" ? "אימייל או סיסמה שגויים" : "שגיאה ביצירת חשבון");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-3xl shadow-xl"
        style={{ background: "var(--surface)" }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💅</div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            רוני ניילס
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {mode === "login" ? "ברוכה הבאה" : "צרי חשבון חדש"}
          </p>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border font-medium transition-all hover:shadow-md disabled:opacity-60 mb-4"
          style={{ borderColor: "var(--border-color)", color: "var(--foreground)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
            <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
            <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
            <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
          </svg>
          המשך עם Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>או</span>
          <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmail} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="שם מלא"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border"
              style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
            />
          )}
          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            dir="ltr"
            className="w-full px-4 py-3 rounded-2xl border"
            style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            dir="ltr"
            className="w-full px-4 py-3 rounded-2xl border"
            style={{ borderColor: "var(--border-color)", background: "var(--accent)" }}
          />
          {error && (
            <p className="text-sm text-center" style={{ color: "#e53e3e" }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "רגע..." : mode === "login" ? "התחברות" : "הרשמה"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full mt-4 text-sm text-center"
          style={{ color: "var(--primary-dark)" }}
        >
          {mode === "login" ? "אין לך חשבון? הירשמי" : "כבר יש לך חשבון? התחברי"}
        </button>
      </div>
    </div>
  );
}
