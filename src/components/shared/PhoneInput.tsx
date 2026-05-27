"use client";
import { useEffect, useRef, useState } from "react";
import {
  RecaptchaVerifier,
  linkWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { updateUserPhone } from "@/lib/firestore/users";

interface Props {
  uid: string;
  onDone: () => void;
}

const RECAPTCHA_ID = "phone-recaptcha-widget";

function getHebrewError(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-phone-number":
      return "מספר טלפון לא תקין.";
    case "auth/too-many-requests":
      return "יותר מדי ניסיונות. נסה שוב מאוחר יותר.";
    case "auth/quota-exceeded":
      return "חריגה ממכסת SMS.";
    case "auth/credential-already-in-use":
      return "מספר זה כבר משויך לחשבון אחר.";
    case "auth/invalid-verification-code":
      return "קוד שגוי. נסה שוב.";
    case "auth/code-expired":
      return "הקוד פג תוקף. שלח קוד חדש.";
    case "auth/invalid-app-credential":
    case "auth/captcha-check-failed":
      return "אימות CAPTCHA נכשל. רענן את הדף ונסה שוב.";
    case "auth/operation-not-allowed":
      return "שליחת SMS לישראל לא מופעלת בפיירבייס. ראה הוראות למטה.";
    default:
      return `שגיאה: ${code ?? "unknown"}`;
  }
}

export function PhoneInput({ uid, onDone }: Props) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, RECAPTCHA_ID, {
      size: "normal",
    });
    recaptchaRef.current = verifier;
    // Render immediately so the checkbox appears when the modal opens
    verifier.render().catch((err) =>
      console.error("[PhoneInput] reCAPTCHA render error:", err)
    );
    return () => {
      verifier.clear();
      recaptchaRef.current = null;
    };
  }, []);

  function buildFullPhone(raw: string): string {
    const cleaned = raw.replace(/\D/g, "");
    const normalized = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
    return `+972${normalized}`;
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 9) {
      setError("מספר טלפון לא תקין");
      return;
    }
    const fullPhone = buildFullPhone(phone);

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("לא מחובר");

      const result = await linkWithPhoneNumber(
        currentUser,
        fullPhone,
        recaptchaRef.current!
      );
      setConfirmation(result);
      setStep("otp");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      console.error("[PhoneInput] error:", code, err);

      if (code === "auth/provider-already-linked") {
        // Phone already linked in Firebase Auth — only auto-verify if it's the same number
        const existingPhone = auth.currentUser?.phoneNumber;
        if (existingPhone && existingPhone === fullPhone) {
          await updateUserPhone(uid, cleaned, true);
          onDone();
          return;
        }
        setError("חשבון זה כבר משויך למספר טלפון אחר. פנה לרוני לעזרה.");
        return;
      }

      setError(getHebrewError(code));

      // Recreate and re-render verifier so user can retry
      recaptchaRef.current?.clear();
      const newVerifier = new RecaptchaVerifier(auth, RECAPTCHA_ID, { size: "normal" });
      recaptchaRef.current = newVerifier;
      newVerifier.render().catch(console.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (otp.length < 6) {
      setError("הקוד חייב להיות 6 ספרות");
      return;
    }
    setLoading(true);
    try {
      await confirmation!.confirm(otp);
      const cleaned = phone.replace(/\D/g, "");
      await updateUserPhone(uid, cleaned, true);
      onDone();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      console.error("[PhoneInput] verify error:", code, err);
      setError(getHebrewError(code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-3xl shadow-xl"
        style={{ background: "var(--surface)" }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">💅</div>
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            {step === "phone" ? "מספר טלפון" : "קוד אימות"}
          </h2>
          <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
            {step === "phone"
              ? "נדרש פעם אחת בלבד לאישור תורים"
              : `נשלח SMS ל-${phone} — הכניסי את הקוד`}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-0000000"
              dir="ltr"
              className="w-full px-4 py-3 rounded-2xl border text-center text-lg"
              style={{
                borderColor: error ? "#e53e3e" : "var(--border-color)",
                background: "var(--accent)",
              }}
            />

            {/* reCAPTCHA checkbox renders here */}
            <div className="flex justify-center">
              <div id={RECAPTCHA_ID} />
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: "#e53e3e" }}>
                {error}
              </p>
            )}

            {error === getHebrewError("auth/operation-not-allowed") && (
              <div className="text-xs p-3 rounded-xl" style={{ background: "var(--accent)", color: "var(--muted-foreground)" }}>
                <p className="font-semibold mb-1">להפעלה ב-Firebase Console:</p>
                <p>Authentication → Sign-in method → Phone → הפעל</p>
                <p>Authentication → Settings → SMS region policy → Allow → ישראל (+972)</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: "var(--primary)" }}
            >
              {loading ? "שולח קוד..." : "שלח קוד אימות"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="------"
              dir="ltr"
              className="w-full px-4 py-3 rounded-2xl border text-center text-2xl tracking-widest font-bold"
              style={{
                borderColor: error ? "#e53e3e" : "var(--border-color)",
                background: "var(--accent)",
              }}
            />
            {error && (
              <p className="text-sm text-center" style={{ color: "#e53e3e" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: "var(--primary)" }}
            >
              {loading ? "מאמת..." : "אמתי קוד"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
              className="text-sm text-center"
              style={{ color: "var(--muted-foreground)" }}
            >
              שלחי קוד מחדש
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
