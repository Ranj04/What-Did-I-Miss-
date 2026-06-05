import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { DemoBanner } from "@/components/DemoBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "What Did I Miss? — Catch up on what you missed in class",
  description:
    "Missed class? What Did I Miss? turns scattered lectures, assignments, announcements, and group updates into a personalized catch-up plan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <DemoBanner />
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
