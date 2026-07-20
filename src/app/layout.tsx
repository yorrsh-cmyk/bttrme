import type { Metadata, Viewport } from "next";
import { DEFAULT_LANGUAGE, dirFor, t } from "@/i18n/catalog";
import "./globals.css";

export const metadata: Metadata = {
  title: t(DEFAULT_LANGUAGE).app.name,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// The signed-in shell ((app)/layout.tsx) re-reads lang/dir from the user row;
// this root default covers the login screen before a session exists.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={DEFAULT_LANGUAGE} dir={dirFor(DEFAULT_LANGUAGE)}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
