import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Globe3D from "@/components/Globe3D";
import ThemeInit from "@/components/ThemeInit";
import AccentInit from "@/components/AccentInit";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nrt-ai.rohan-nallapaneni.workers.dev"),
  title: "NRT AI",
  description: "A free, always-on AI assistant that chats, browses, codes, and creates — built by Rohan Teja Nallapaneni",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeInit />
        <AccentInit />
        <div className="aurora" aria-hidden="true">
          <div className="aurora-blob one" />
          <div className="aurora-blob two" />
        </div>
        <Globe3D />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
