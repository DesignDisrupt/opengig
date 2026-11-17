import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { BrandMark, Wordmark } from "@/components/Brand";
import { HeaderNav } from "@/components/HeaderNav";
import { ScrollHeader } from "@/components/ScrollHeader";
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
  title: "OpenGig",
  description: "Mark your availability; find dates that work for the whole band.",
  // Private to the band — never in search results.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ScrollHeader>
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 md:px-8">
            <Link href="/" aria-label="OpenGig" className="whitespace-nowrap">
              {/* On phones the toggle needs the width; the wordmark shrinks to its mark. */}
              <BrandMark className="size-8 sm:hidden" />
              <span className="hidden sm:inline">
                <Wordmark />
              </span>
            </Link>
            <Suspense fallback={null}>
              <HeaderNav />
            </Suspense>
          </nav>
        </ScrollHeader>
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
