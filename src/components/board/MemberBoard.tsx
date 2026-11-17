"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { QuickResult } from "@/app/actions";
import type { BandOption, MemberDay } from "@/lib/board";
import { dayOfMonth, longDate, monthLabel } from "@/lib/dates";
import { bandColor } from "@/lib/view";
import { CalendarGrid, GigChip } from "./CalendarGrid";
import { DayForm } from "./DayForm";
import { Panel } from "./Panel";

type Selection = { kind: "day"; date: string } | { kind: "block" } | { kind: "gig" } | null;


export function MemberBoard({
  personId,
  personName,
  month,
  today,
  weeks,
  manager = false,
  bands,
  myBandIds,
  prevHref,
  nextHref,
  todayHref,
}: {
  personId: string;
  personName: string;
  month: string;
  today: string;
  weeks: (MemberDay | null)[][];
  /** The manager's calendar: every band's gigs, and the panel only adds gigs. */
  manager?: boolean;
  bands: BandOption[];
  myBandIds: string[];
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  const [picked, setSel] = useState<Selection>(null);
  // A day picked in another month doesn't carry over when the month changes.
  const sel = picked?.kind === "day" && !picked.date.startsWith(month) ? null : picked;
  const [toast, setToast] = useState<string>();
  const close = useCallback(() => setSel(null), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(undefined), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const done = (r: QuickResult) => {
    if (r.ok) setToast(r.message);
    setSel(null);
  };

  const days = weeks.flat().filter((d): d is MemberDay => !!d);
  const quickDate = month === today.slice(0, 7) ? today : `${month}-01`;
  // With nothing picked, the desktop panel shows today (or the 1st of another month).
  const view: NonNullable<Selection> = sel ?? { kind: "day", date: quickDate };
  const pickedDay = view.kind === "day" ? days.find((d) => d.date === view.date) : undefined;
  const marked = days.filter((d) => d.gigs.length || d.mark);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
      <div>
        {/* Title row: name, quick actions */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] lg:text-[34px]">
              {personName}
            </h1>
            <p className="mt-1 text-[15px] text-muted">
              {manager ? "Every band’s gigs. Pick a day to add one." : "Every day is free. Tap one to change it."}
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            {!manager && (
              <button onClick={() => setSel({ kind: "block" })} className={`${action} bg-surface hover:bg-line`}>
                Block dates
              </button>
            )}
            <button onClick={() => setSel({ kind: "gig" })} className={`${action} bg-fg text-bg hover:opacity-85`}>
              + Add gig
            </button>
          </div>
        </div>

        {/* Month bar */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight lg:text-[20px]">{monthLabel(month)}</h2>
          <div className="flex items-center gap-1">
            <Link href={todayHref} scroll={false} className="mr-1 rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-fg">
              Today
            </Link>
            <Link href={prevHref} scroll={false} aria-label="Previous month" className={arrow}>
              ‹
            </Link>
            <Link href={nextHref} scroll={false} aria-label="Next month" className={arrow}>
              ›
            </Link>
          </div>
        </div>

        <CalendarGrid
          weeks={weeks}
          cell={(d) => (
            <Cell
              day={d}
              today={today}
              selected={sel?.kind === "day" && sel.date === d.date}
              focused={!sel && view.kind === "day" && view.date === d.date}
              manager={manager}
              onPick={() => setSel({ kind: "day", date: d.date })}
            />
          )}
        />

        {/* Key */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
          {!manager && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border border-dashed border-fg/50" /> Maybe
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-faint" /> Busy
              </span>
            </>
          )}
          {bands.map((b) => (
            <span key={b.id} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: bandColor(b.id) }} /> {b.short}
            </span>
          ))}
        </div>

        {/* This month, as a list — mainly for phones */}
        <section className="mt-10 lg:hidden">
          <h3 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">This month</h3>
          {marked.length === 0 ? (
            <p className="py-3 text-[15px] text-muted">{manager ? "No gigs this month." : "Free all month."}</p>
          ) : (
            <div className="divide-y divide-line border-y border-line">
              {marked.map((d) => (
                <button
                  key={d.date}
                  onClick={() => setSel({ kind: "day", date: d.date })}
                  className="flex w-full items-center gap-4 py-3.5 text-left"
                >
                  <span className="w-20 shrink-0 text-[14px] font-medium">{shortLabel(d.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-muted">{describeDay(d)}</span>
                  <span aria-hidden className="text-faint">›</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <Panel
        sheetOpen={sel !== null}
        onClose={close}
        title={
          view.kind === "day"
            ? `${view.date === today ? "Today · " : ""}${longDate(view.date).replace(/, \d{4}$/, "")}`
            : view.kind === "gig"
              ? "Add a gig"
              : "Block dates"
        }
        sub={
          view.kind === "day"
            ? describeDay(pickedDay, manager)
            : view.kind === "block"
              ? "One day or a stretch of them."
              : "Details are optional."
        }
      >
        {view.kind === "day" && (
          <DayForm
            key={`${view.date}-${pickedDay?.mark?.status}-${pickedDay?.gigs.length}`}
            personId={personId}
            date={view.date}
            day={pickedDay}
            bands={bands}
            myBandIds={myBandIds}
            gigOnly={manager}
            onDone={done}
          />
        )}
        {view.kind === "block" && (
          <DayForm key="block" personId={personId} date={quickDate} bands={bands} myBandIds={myBandIds} start="busy" editableDate onDone={done} />
        )}
        {view.kind === "gig" && (
          <DayForm
            key="gig"
            personId={personId}
            date={quickDate}
            bands={bands}
            myBandIds={myBandIds}
            start="gig"
            gigOnly={manager}
            editableDate
            onDone={done}
          />
        )}
      </Panel>

      {toast && (
        <div role="status" className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-5">
          <span className="rounded-full bg-fg px-5 py-2.5 text-[14px] font-medium text-bg shadow-lg">✓ {toast}</span>
        </div>
      )}
    </div>
  );
}

function Cell({
  day,
  today,
  selected,
  focused,
  manager,
  onPick,
}: {
  day: MemberDay;
  manager: boolean;
  today: string;
  selected: boolean;
  /** Shown in the desktop panel by default (today) without being tapped. */
  focused: boolean;
  onPick: () => void;
}) {
  const gig = day.gigs[0];
  const status = gig ? "gig" : (day.mark?.status ?? "free");
  const past = day.date < today;
  const isToday = day.date === today;

  // Phone: a round marker, shape tells the state.
  const dot =
    status === "gig"
      ? "font-semibold text-white"
      : status === "busy"
        ? "bg-surface text-muted line-through decoration-1"
        : status === "maybe"
          ? "border-[1.5px] border-dashed border-fg/45"
          : "";

  return (
    <button
      onClick={onPick}
      aria-pressed={selected}
      aria-label={`${longDate(day.date)}: ${describeDay(day, manager)}`}
      className={`group flex w-full flex-col items-center md:h-full md:min-h-[112px] md:items-stretch md:p-2 md:text-left md:transition-[background-color,box-shadow] md:duration-200 ${
        selected
          ? "md:bg-surface/40 md:shadow-[inset_0_0_0_2px_var(--fg)]"
          : `md:hover:bg-surface/60 ${focused ? "lg:shadow-[inset_0_0_0_1.5px_var(--fg)]" : ""}`
      } ${past ? "opacity-40" : ""}`}
    >
      {/* phone */}
      <span
        className={`grid size-11 place-items-center rounded-full text-[15px] md:hidden ${dot} ${selected ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : ""}`}
        style={gig ? { background: bandColor(gig.bandId) } : undefined}
      >
        {dayOfMonth(day.date)}
      </span>
      <span aria-hidden className={`mt-0.5 size-1 rounded-full md:hidden ${isToday ? "bg-fg" : ""}`} />

      {/* desktop */}
      <span
        className={`hidden size-7 place-items-center rounded-full text-[14px] md:grid ${
          isToday ? "bg-fg font-semibold text-bg" : "font-medium"
        }`}
      >
        {dayOfMonth(day.date)}
      </span>
      <span className="mt-1.5 hidden flex-col gap-1 md:flex">
        {day.gigs.map((g) => (
          <GigChip key={g.id} color={bandColor(g.bandId)} label={`${g.bandAbbr} booked`} />
        ))}
        {!gig && day.mark?.status === "busy" && (
          <span className="truncate rounded-md bg-surface px-1.5 py-1 text-[11px] leading-tight text-muted">
            {day.mark.note || "Busy"}
          </span>
        )}
        {!gig && day.mark?.status === "maybe" && (
          <span className="truncate rounded-md border border-dashed border-fg/30 px-1.5 py-0.5 text-[11px] leading-tight text-muted">
            Maybe{day.mark.note ? ` · ${day.mark.note}` : ""}
          </span>
        )}
      </span>
    </button>
  );
}

function describeDay(d?: MemberDay, manager = false): string {
  if (d?.gigs.length) return d.gigs.map((g) => `Gig · ${g.bandName}`).join(" + ");
  if (manager) return "No gigs";
  if (!d) return "Free";
  if (!d.mark) return "Free";
  const label = { free: "Free", maybe: "Maybe", busy: "Busy" }[d.mark.status];
  return d.mark.note ? `${label} · ${d.mark.note}` : label;
}

const shortLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });


const action =
  "inline-flex h-11 flex-1 items-center justify-center rounded-full px-5 text-[14px] font-medium whitespace-nowrap transition-colors duration-200 sm:flex-none";
const arrow =
  "grid size-9 place-items-center rounded-full text-lg text-muted transition-colors duration-200 hover:bg-surface hover:text-fg";
