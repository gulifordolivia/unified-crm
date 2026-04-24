import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unified CRM",
  description:
    "A unified lead command center for agents and preforeclosure operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--color-ink)] text-[var(--color-sand)]">
        {children}
      </body>
    </html>
  );
}
