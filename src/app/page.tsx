import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <div className="pt-8 pb-10">
        {/* Hero */}
        <div
          className="text-center p-10 rounded-3xl mb-8"
          style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--surface) 100%)" }}
        >
          <div className="text-6xl mb-4">💅</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            רוני ניילס
          </h1>
          <p className="text-base mb-6" style={{ color: "var(--muted-foreground)" }}>
            טיפוח ציפורניים מקצועי ואישי
          </p>
          <Link
            href="/book"
            className="inline-block px-8 py-4 rounded-2xl font-semibold text-white text-base transition-all hover:shadow-lg active:scale-95"
            style={{ background: "var(--primary)" }}
          >
            הזמני תור עכשיו
          </Link>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/clinic"
            className="p-5 rounded-2xl border text-center transition-all hover:shadow-md"
            style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
          >
            <div className="text-3xl mb-2">📍</div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>מיקום ושעות</p>
          </Link>
          <Link
            href="/my-appointments"
            className="p-5 rounded-2xl border text-center transition-all hover:shadow-md"
            style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
          >
            <div className="text-3xl mb-2">📅</div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>התורים שלי</p>
          </Link>
        </div>

        {/* Info strip */}
        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}
        >
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--foreground)" }}>
            איך זה עובד?
          </h2>
          <div className="flex flex-col gap-3">
            {[
              ["1️⃣", "בחרי שירות"],
              ["2️⃣", "בחרי תאריך ושעה"],
              ["3️⃣", "שלחי בקשה — רוני תאשר ותעדכן"],
            ].map(([emoji, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{emoji}</span>
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
