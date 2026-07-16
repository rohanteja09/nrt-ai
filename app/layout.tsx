import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Globe3D from "@/components/Globe3D";
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
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col overflow-hidden">
        <AccentInit />
        <div className="aurora" aria-hidden="true">
          <div className="aurora-blob one" />
          <div className="aurora-blob two" />
        </div>
        <Globe3D />
        {/* pointer-events-none so empty space still click-through's to the
            background's clickable planets — actual UI pieces (header, chat,
            sidebar, footer) re-enable it on themselves. min-h-0 keeps this
            bounded to the viewport instead of growing with tall content
            (e.g. a long code block), which used to make the whole page
            scroll — including the header and sidebar — instead of just the
            chat's own message list. */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col pointer-events-none">
          {children}
        </div>
      </body>
    </html>
  );
}
