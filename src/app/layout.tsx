import type { Metadata, Viewport } from "next";
import { DEFAULT_LANGUAGE, dirFor, t } from "@/i18n/catalog";
import { getLanguage } from "@/server/language";
import "./globals.css";

export const metadata: Metadata = {
  title: t(DEFAULT_LANGUAGE).app.name,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the iOS status bar / home indicator so we can pad the fixed
  // bottom nav past the home bar with env(safe-area-inset-*) (home-screen mode).
  viewportFit: "cover",
};

// <html lang/dir> comes from the language cookie (mirror of the user row,
// synced on login and settings save) — no DB read on the render hot path.
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const language = await getLanguage();
  return (
    <html lang={language} dir={dirFor(language)}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
