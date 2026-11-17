import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { usingDatabase } from "@/lib/store";
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
  title: "Band Gig Calendar",
  description: "Mark your availability; find dates that work for the whole band.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur-md">
          <nav className="mx-auto flex h-14 max-w-md items-center justify-between px-5">
            <Link href="/" className="text-[15px] font-semibold tracking-tight">
              Gig Calendar
            </Link>
            <Link
              href="/dates"
              className="rounded-full bg-surface px-4 py-2 text-[13px] font-medium transition-colors duration-200 hover:bg-line"
            >
              Dates that work
            </Link>
          </nav>
        </header>
        {children}
        {!usingDatabase && (
          <p className="pb-6 text-center text-[11px] text-faint">
            Demo data · changes reset when the server restarts
          </p>
        )}
      </body>
    </html>
  );
}
