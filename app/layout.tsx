import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VELLUM AI Agent — Product Photography Director",
  description: "AI-powered product photography studio. Locked product identity, generative creative photography direction.",
  keywords: ["Product Photography", "AI Studio", "E-commerce Photography", "Product Lock", "VELLUM AI Agent", "VELLUM"],
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col relative overflow-x-hidden selection:bg-[#1951fc]/40 selection:text-white">
        {/* Ambient glow — very subtle blue on pure black */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-5%] left-[0%] w-[700px] h-[500px] rounded-full opacity-40 liquid-float" style={{ background: 'radial-gradient(ellipse, rgba(25,81,252,0.18) 0%, transparent 70%)' }} />
          <div className="absolute top-[30%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-30 liquid-float" style={{ background: 'radial-gradient(ellipse, rgba(55,129,252,0.12) 0%, transparent 70%)', animationDelay: '-4s' }} />
          <div className="absolute bottom-[0%] left-[20%] w-[800px] h-[400px] rounded-full opacity-25 liquid-float" style={{ background: 'radial-gradient(ellipse, rgba(11,44,177,0.15) 0%, transparent 70%)', animationDelay: '-7s' }} />
        </div>

        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
