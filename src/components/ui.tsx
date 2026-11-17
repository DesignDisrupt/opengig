import Link from "next/link";
import type { ReactNode } from "react";
import { addMonths, monthLabel } from "@/lib/dates";
import { bandColor } from "@/lib/view";

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-md flex-1 px-5 pt-6 pb-20">{children}</main>;
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

/** "December 2026" on the left, ‹ › on the right. */
export function MonthNav({ month, href }: { month: string; href: (month: string) => string }) {
  const arrow =
    "grid size-9 place-items-center rounded-full text-lg text-muted transition-colors duration-200 hover:bg-surface hover:text-fg";
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[17px] font-semibold tracking-tight">{monthLabel(month)}</h2>
      <div className="flex gap-1">
        <Link href={href(addMonths(month, -1))} className={arrow} aria-label="Previous month">
          ‹
        </Link>
        <Link href={href(addMonths(month, 1))} className={arrow} aria-label="Next month">
          ›
        </Link>
      </div>
    </div>
  );
}

/** A stacked date tile — DEC over 18 — that leads a list row. */
export function DateTile({ date, tone }: { date: string; tone?: string }) {
  const d = new Date(`${date}T00:00:00Z`);
  const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const wd = d.toLocaleString("en-US", { weekday: "short", timeZone: "UTC" });
  return (
    <div className="flex w-11 shrink-0 flex-col items-center leading-none">
      <span className="text-[10px] font-semibold tracking-[0.06em]" style={{ color: tone ?? "var(--muted)" }}>
        {mon}
      </span>
      <span className="mt-1 text-[22px] font-semibold tracking-tight">{d.getUTCDate()}</span>
      <span className="mt-1 text-[10px] text-muted">{wd}</span>
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
