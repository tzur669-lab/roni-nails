// Disable static generation — app requires real-time Firebase data
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "רני חנימוב | לק ג׳ל מקצועי",
  description: "לק ג׳ל מקצועי ואישי — הזמיני תור בקלות",
  manifest: "/manifest.json",
  icons: { apple: "/icons/apple-touch-icon.png" },
  other: {
    "theme-color": "#C9A882",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
