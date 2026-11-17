import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { HeaderNav } from "@/components/HeaderNav";
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
          <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-5 md:px-8">
            <Link href="/" aria-label="Gig Calendar" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight whitespace-nowrap">
              {/* On phones the toggle needs the width; the name shrinks to a mark. */}
              <span aria-hidden className="grid size-8 place-items-center rounded-full bg-fg text-[14px] text-bg sm:hidden">
                ♪
              </span>
              <span className="hidden sm:inline">Gig Calendar</span>
            </Link>
            <Suspense fallback={null}>
              <HeaderNav />
            </Suspense>
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
