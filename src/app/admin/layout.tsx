"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_NAV = [
  { href: "/admin", label: "לוח ראשי", icon: "🏠" },
  { href: "/admin/appointments", label: "תורים", icon: "📅" },
  { href: "/admin/services", label: "שירותים", icon: "✨" },
  { href: "/admin/availability", label: "זמינות", icon: "🗓" },
  { href: "/admin/clients", label: "לקוחות", icon: "👥" },
  { href: "/admin/clinic", label: "הסלון", icon: "🏠" },
  { href: "/admin/payment", label: "תשלום", icon: "💳" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/");
  }, [isAdmin, loading, router]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-4xl animate-pulse">💅</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-50 px-4 h-14 flex items-center justify-between"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-color)" }}
      >
        <Link href="/" className="text-lg font-bold" style={{ color: "var(--primary-dark)" }}>
          💅 רוני ניילס
        </Link>
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "var(--accent)", color: "var(--primary-dark)" }}>
          ממשק ניהול
        </span>
      </header>

      <div className="flex max-w-5xl mx-auto">
        {/* Sidebar */}
        <aside
          className="hidden md:flex flex-col w-52 p-4 gap-1 min-h-screen sticky top-14"
          style={{ borderLeft: "1px solid var(--border-color)" }}
        >
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={
                pathname === item.href
                  ? { background: "var(--accent)", color: "var(--primary-dark)" }
                  : { color: "var(--foreground)" }
              }
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex overflow-x-auto"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border-color)" }}
      >
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-shrink-0 flex flex-col items-center px-3 py-2 text-xs"
            style={{ color: pathname === item.href ? "var(--primary-dark)" : "var(--muted-foreground)" }}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
