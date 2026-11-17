import Link from "next/link";
import type { ReactNode } from "react";
import { bandColor } from "@/lib/view";

/** Narrow for forms and lists; `wide` for the calendar workspaces on desktop. */
export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main
      className={`mx-auto w-full flex-1 px-5 pt-6 pb-20 ${wide ? "max-w-md md:max-w-7xl md:px-8 lg:pt-10" : "max-w-md md:pt-10"}`}
    >
      {children}
    </main>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-7">
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">{children}</h1>
      {sub && <p className="mt-1.5 text-[15px] text-muted">{sub}</p>}
    </div>
  );
}

/** Small caps label that heads a group, e.g. "DECEMBER 2026". */
export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase ${className}`}>
      {children}
    </h2>
  );
}

/** A round icon button that leads back, top-left. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="mb-5 grid size-10 place-items-center rounded-full bg-surface text-lg transition-colors duration-200 hover:bg-line"
    >
      <span aria-hidden>←</span>
    </Link>
  );
}

/** Pill segmented control made of links, so the choice lives in the URL. */
export function Segmented({
  items,
  className = "",
}: {
  items: { href: string; label: ReactNode; active: boolean; key: string }[];
  className?: string;
}) {
  return (
    <div className={`flex rounded-full bg-surface p-1 ${className}`}>
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm whitespace-nowrap transition-colors duration-200 ${
            it.active ? "bg-bg font-medium shadow-sm" : "text-muted hover:text-fg"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-line border-y border-line">{children}</div>;
}

export function BandDot({ bandId, className = "" }: { bandId: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-2 shrink-0 rounded-full ${className}`}
      style={{ background: bandColor(bandId) }}
    />
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-3xl bg-surface ${className}`} />;
}

const button =
  "inline-flex h-[52px] w-full items-center justify-center rounded-full px-6 text-[15px] font-medium transition-colors duration-200";
export const primaryButton = `${button} bg-fg text-bg hover:opacity-85`;
export const quietButton = `${button} text-muted hover:text-fg`;

export const inputClass =
  "w-full rounded-2xl bg-surface px-4 py-3.5 outline-none placeholder:text-faint focus:ring-2 focus:ring-fg/15";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-[13px] text-muted">{label}</span>
      {children}
    </label>
  );
}
