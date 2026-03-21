import type { Metadata } from "next";
import localFont from "next/font/local";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "VedaAI - AI Teacher's Assistant",
  description: "Your AI-powered teaching assistant platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-3">
            <TopNav />
            <main className="flex-1 min-h-0 overflow-auto no-scrollbar">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
