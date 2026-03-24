import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import localFont from "next/font/local";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage-grotesque",
});

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
      <body className={`${bricolageGrotesque.className} ${bricolageGrotesque.variable} ${geistSans.variable} ${geistMono.variable}`}>
        <ToastProvider>
          <div className="flex h-screen bg-off-white/50 md:bg-background">
            <Sidebar />
            <div className="flex min-h-0 flex-1 flex-col gap overflow-hidden p-3 gap-5.5">
              <TopNav />
              <main className="flex-1 min-h-0 overflow-auto no-scrollbar">{children}</main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
