"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuickResult } from "@/app/actions";
import type { BandOption, MemberDay } from "@/lib/board";
import { dayOfMonth, longDate } from "@/lib/dates";
import { bandColor } from "@/lib/view";
import { CalendarGrid } from "./CalendarGrid";
import { GigChip } from "./GigChip";
import { DayForm } from "./DayForm";
import { MonthBar } from "./MonthBar";
import { Panel } from "./Panel";

type Selection = { kind: "day"; date: string } | { kind: "block" } | { kind: "gig" } | null;

export function MemberBoard({
  personId,
  personName,
  month,
  today,
  weeks,
  manager = false,
  canBook = false,
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
  /** Adam and Brady: + Add gig, the Gig option and gig Edit/Cancel. */
  canBook?: boolean;
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
  const marked = days.filter((d) => d.gigs.length || d.mark || d.others.length);

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
              {manager
                ? "Every band’s gigs. Pick a day to add one."
                : "Every day is free. Tap one to change it. Everyone’s gigs and plans show too."}
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            {!manager && (
              <button
                onClick={() => setSel({ kind: "block" })}
                className={`${action} bg-surface hover:bg-line`}
              >
                Block dates
              </button>
            )}
            {canBook && (
              <button
                onClick={() => setSel({ kind: "gig" })}
                className={`${action} bg-fg text-bg hover:opacity-85`}
              >
                + Add gig
              </button>
            )}
          </div>
        </div>

        <MonthBar month={month} prevHref={prevHref} nextHref={nextHref} todayHref={todayHref} />

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
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-dashed border-fg/50" /> Maybe
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-faint" /> Busy
          </span>
          {bands.map((b) => (
            <span key={b.id} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: bandColor(b.id) }} /> {b.short}
            </span>
          ))}
        </div>

        {/* This month, as a list — mainly for phones */}
        <section className="mt-10 lg:hidden">
          <h3 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
            This month
          </h3>
          {marked.length === 0 ? (
            <p className="py-3 text-[15px] text-muted">
              {manager ? "No gigs this month." : "Free all month."}
            </p>
          ) : (
            <div className="divide-y divide-line border-y border-line">
              {marked.map((d) => (
                <button
                  key={d.date}
                  onClick={() => setSel({ kind: "day", date: d.date })}
                  className="flex w-full items-center gap-4 py-3.5 text-left"
                >
                  <span className="w-20 shrink-0 text-[14px] font-medium">{shortLabel(d.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-muted">
                    {[describeDay(d, manager, true), ...d.others.map(otherLabel)].filter(Boolean).join(" · ")}
                  </span>
                  <span aria-hidden className="text-faint">
                    ›
                  </span>
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
        {view.kind === "day" && pickedDay && pickedDay.others.length > 0 && <Others day={pickedDay} />}
        {view.kind === "day" && (manager ? canBook : true) && (
          <DayForm
            key={`${view.date}-${pickedDay?.mark?.status}-${pickedDay?.gigs.length}`}
            personId={personId}
            date={view.date}
            day={pickedDay}
            bands={bands}
            myBandIds={myBandIds}
            gigOnly={manager}
            canBook={canBook}
            onDone={done}
          />
        )}
        {view.kind === "block" && (
          <DayForm
            key="block"
            personId={personId}
            date={quickDate}
            bands={bands}
            myBandIds={myBandIds}
            start="busy"
            editableDate
            canBook={canBook}
            onDone={done}
          />
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
            canBook={canBook}
            editableDate
            onDone={done}
          />
        )}
      </Panel>

      {toast && (
        <div role="status" className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-5">
          <span className="rounded-full bg-fg px-5 py-2.5 text-[14px] font-medium text-bg shadow-lg">
            ✓ {toast}
          </span>
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
  // Only your own bands' gigs make you busy; other bands' still list below.
  const gig = day.gigs.find((g) => g.mine);
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
          <GigChip key={g.id} color={bandColor(g.bandId)} label={`${g.bandAbbr} booked`} gig={g} />
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
        {day.others.slice(0, 2).map((o) => (
          <span
            key={o.name}
            className="flex min-w-0 items-center gap-1.5 px-0.5 text-[11px] leading-tight text-muted"
          >
            <OtherMark status={o.status} />
            <span className="truncate">
              {o.name} {o.status}
            </span>
          </span>
        ))}
        {day.others.length > 2 && (
          <span className="px-0.5 text-[11px] text-faint">+{day.others.length - 2} more</span>
        )}
      </span>
    </button>
  );
}

/** Your day in words. `quiet` drops a plain "Free" so lists only say what matters. */
function describeDay(d?: MemberDay, manager = false, quiet = false): string {
  const mine = d?.gigs.filter((g) => g.mine) ?? [];
  if (mine.length) return mine.map((g) => `${g.bandAbbr} booked`).join(" + ");
  const others = d?.gigs.filter((g) => !g.mine) ?? [];
  if (manager)
    return others.length ? others.map((g) => `${g.bandAbbr} booked`).join(" + ") : quiet ? "" : "No gigs";
  if (!d?.mark) {
    const free = quiet ? "" : "Free";
    return others.length
      ? [free, ...others.map((g) => `${g.bandAbbr} booked`)].filter(Boolean).join(" · ")
      : free;
  }
  const label = { free: "Free", maybe: "Maybe", busy: "Busy" }[d.mark.status];
  return d.mark.note ? `${label} · ${d.mark.note}` : label;
}

const otherLabel = (o: MemberDay["others"][number]) => `${o.name} ${o.status}${o.note ? ` (${o.note})` : ""}`;

function OtherMark({ status }: { status: "maybe" | "busy" }) {
  return status === "maybe" ? (
    <span aria-hidden className="size-2 shrink-0 rounded-full border border-dashed border-fg/50" />
  ) : (
    <span aria-hidden className="size-2 shrink-0 rounded-full bg-faint" />
  );
}

/** Who else marked this day, in the panel above your own choices. */
function Others({ day }: { day: MemberDay }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">Others</h3>
      <div className="divide-y divide-line rounded-2xl bg-surface">
        {day.others.map((o) => (
          <div key={o.name} className="flex items-center gap-2.5 px-4 py-2.5">
            <OtherMark status={o.status} />
            <span className="text-[14px] font-medium">{o.name}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-muted">
              {o.status === "busy" ? "Busy" : "Maybe"}
              {o.note ? ` · ${o.note}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const shortLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const action =
  "inline-flex h-11 flex-1 items-center justify-center rounded-full px-5 text-[14px] font-medium whitespace-nowrap transition-colors duration-200 sm:flex-none";
