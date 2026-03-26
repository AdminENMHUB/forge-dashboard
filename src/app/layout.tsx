import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EganForge | CEO Dashboard",
  description: "Real-time oversight of the EganForge multi-agentic framework",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[var(--surface-0)] font-sans text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
