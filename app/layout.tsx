import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
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
        <div className="aurora" aria-hidden="true">
          <div className="aurora-blob one" />
          <div className="aurora-blob two" />
        </div>
        <div className="globe-wrap" aria-hidden="true">
          <div className="globe" />
        </div>
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
