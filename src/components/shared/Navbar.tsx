"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/", label: "בית" },
  { href: "/book", label: "הזמן תור" },
  { href: "/clinic", label: "הסלון" },
  { href: "/my-appointments", label: "התורים שלי" },
];

export function Navbar() {
  const { user, appUser, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/admin")) return null;

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header
      style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-color)" }}
      className="sticky top-0 z-50 shadow-sm"
    >
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold" style={{ color: "var(--primary-dark)" }}>
          💅 רוני ניילס
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "text-white"
                  : "hover:opacity-80"
              }`}
              style={
                pathname === item.href
                  ? { background: "var(--primary)", color: "white" }
                  : { color: "var(--foreground)" }
              }
            >
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-2 rounded-xl text-sm font-medium"
              style={{ color: "var(--primary-dark)" }}
            >
              ניהול
            </Link>
          )}

          {user ? (
            <>
              <span
                className="text-sm font-medium px-3 py-1.5 rounded-xl"
                style={{ color: "var(--primary-dark)", background: "var(--accent)" }}
              >
                שלום, {appUser?.name ?? user.displayName ?? ""}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl text-sm font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
                יציאה
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--primary)" }}
            >
              התחברות
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
