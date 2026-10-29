import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HelloCamp | Mais que um campo de férias",
  description: "Explora, aprende e cresce num só lugar. Encontra os melhores campos de férias para as tuas crianças.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#F59E0B]/20 selection:text-[#0F172A]">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}