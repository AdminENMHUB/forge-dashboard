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
      <body className="bg-gray-950 font-sans text-gray-100 antialiased">{children}</body>
    </html>
  );
}
