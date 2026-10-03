import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0c0d0e",
};

export const metadata: Metadata = {
  title: "VELLUM — AI Commercial Product Photography Studio",
  description: "Studio fotografi produk komersial berbasis AI. Mengunci integritas fisik produk asli dengan tata visual studio fotorealistik.",
  keywords: ["Product Photography", "AI Studio", "E-commerce Photography", "Product Lock", "VELLUM"],
  icons: {
    icon: "/vellum-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0c0d0e] text-[#f2efe9] font-sans antialiased overflow-x-hidden selection:bg-[#c88d48]/30 selection:text-white">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
