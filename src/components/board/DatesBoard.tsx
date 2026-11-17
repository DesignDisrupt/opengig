"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { QuickResult } from "@/app/actions";
import type { BandBoardDay, BandOption, MemberDay } from "@/lib/board";
import { dayOfMonth, longDate } from "@/lib/dates";
import { bandAbbr, bandColor } from "@/lib/view";
import { BoardLayout, primaryAction, quietAction } from "./BoardLayout";
import { CalendarGrid } from "./CalendarGrid";
import { GigChip } from "./GigChip";
import { DayForm } from "./DayForm";
import { GigDetails } from "./GigDetails";
import { Panel } from "./Panel";

/**
 * Booking Dates: a month grid of which days work for a band (green works,
 * dashed maybe, faded conflict, filled booked). The side panel explains a
 * day, and lets a member mark their own day right there — Free, Maybe, Busy
 * or a gig — while the manager books.
 */
export function DatesBoard({
  weeks,
  myWeeks,
  manager,
  today,
  month,
  bandId,
  bandName,
  personId,
  bands,
  myBandIds,
  monthBar,
  summary,
}: {
  weeks: (BandBoardDay | null)[][];
  /** The person's own days this month, for the "Your day" part of the panel. */
  myWeeks: (MemberDay | null)[][];
  manager: boolean;
  today: string;
  month: string;
  bandId: string;
  bandName: string;
  /** Whoever is using the app; gigs added here are credited to them. */
  personId: string;
  bands: BandOption[];
  myBandIds: string[];
  monthBar: ReactNode;
  /** Under the title, e.g. "14 open dates for Whiskey Mountain Highway this month." */
  summary: ReactNode;
}) {
  // A date, "add" (+ Add gig), "block" (Block dates), or nothing.
  const [picked, setPicked] = useState<string | null>(null);
  const [toast, setToast] = useState<string>();
  const close = useCallback(() => setPicked(null), []);
  // With nothing picked, the desktop panel shows today (or the 1st of another month).
  const quickDate = month === today.slice(0, 7) ? today : `${month}-01`;
  const mode = picked === "add" || picked === "block" ? picked : null;
  const focusDate = mode ? null : (picked ?? quickDate);
  const day = weeks.flat().find((d) => d?.date === focusDate) ?? undefined;
  const myDay = myWeeks.flat().find((d) => d?.date === focusDate) ?? undefined;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(undefined), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const done = (r: QuickResult) => {
    if (r.ok) setToast(r.message);
    setPicked(null);
  };
  // Booking Dates is only for Adam and Brady, who may add gigs for every band.
  const allBandIds = bands.map((b) => b.id);

  return (
    <>
      <BoardLayout
        title="Booking Dates"
        summary={summary}
        actions={
          <>
            {!manager && (
              <button onClick={() => setPicked("block")} className={quietAction}>
                Block dates
              </button>
            )}
            <button onClick={() => setPicked("add")} className={primaryAction}>
              + Add gig
            </button>
          </>
        }
        monthBar={monthBar}
        panel={
          <Panel
            sheetOpen={picked !== null}
            onClose={close}
            title={
              mode === "add"
                ? "Add a gig"
                : mode === "block"
                  ? "Block dates"
                  : day
                    ? `${day.date === today ? "Today · " : ""}${longDate(day.date).replace(/, \d{4}$/, "")}`
                    : ""
            }
            sub={
              mode === "add"
                ? "WMH, or another band to block the day for its members. Details are optional."
                : mode === "block"
                  ? "One day or a stretch of them."
                  : day
                    ? headline(day, bandName)
                    : undefined
            }
          >
            {mode === "add" && (
              <DayForm
                gigBandIds={allBandIds}
                key="add"
                personId={personId}
                date={quickDate}
                bands={bands}
                myBandIds={myBandIds}
                initialBandId={bandId}
                start="gig"
                editableDate
                gigOnly
                onDone={done}
              />
            )}
            {mode === "block" && (
              <DayForm
                gigBandIds={allBandIds}
                key="block"
                personId={personId}
                date={quickDate}
                bands={bands}
                myBandIds={myBandIds}
                editableDate
                onDone={done}
              />
            )}
            {day && (
              <DayDetail
                day={day}
                myDay={myDay}
                manager={manager}
                bandId={bandId}
                bandName={bandName}
                past={day.date < today}
                personId={personId}
                bands={bands}
                myBandIds={myBandIds}
                onDone={done}
              />
            )}
          </Panel>
        }
      >
        <CalendarGrid
          weeks={weeks}
          cell={(d) => (
            <Cell
              day={d}
              today={today}
              bandId={bandId}
              selected={picked === d.date}
              focused={!picked && d.date === quickDate}
              onPick={() => setPicked(d.date)}
            />
          )}
        />
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-ok-tint ring-1 ring-ok/40" /> Everyone free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-dashed border-fg/50" /> Someone’s a maybe
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: bandColor(bandId) }} />{" "}
            {bandAbbr(bandId)} booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-surface ring-1 ring-line" /> Someone’s out or another
            band plays
          </span>
        </div>
      </BoardLayout>

      {toast && (
        <div role="status" className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-5">
          <span className="rounded-full bg-fg px-5 py-2.5 text-[14px] font-medium text-bg shadow-lg">
            ✓ {toast}
          </span>
        </div>
      )}
    </>
  );
}

function headline(d: BandBoardDay, bandName: string) {
  if (d.booked) return `${bandName} is booked`;
  if (d.verdict === "works" && d.otherBooked) return "Everyone’s free, but another band plays";
  if (d.verdict === "works") return "Everyone’s free";
  if (d.verdict === "maybe") return "Free, with a maybe";
  return "Not everyone can make it";
}

function DayDetail({
  day,
  myDay,
  manager,
  bandId,
  bandName,
  past,
  personId,
  bands,
  myBandIds,
  onDone,
}: {
  day: BandBoardDay;
  myDay?: MemberDay;
  manager: boolean;
  bandId: string;
  bandName: string;
  past: boolean;
  personId: string;
  bands: BandOption[];
  myBandIds: string[];
  onDone: (r: QuickResult) => void;
}) {
  const allBandIds = bands.map((b) => b.id);
  // A member who plays in the booked gig sees it in "Your day" with Edit/Cancel; don't show it twice.
  // The day's gigs are listed once, with Edit/Cancel, inside the form below
  // (myDay carries every band's gigs), so the summaries above step aside.
  const gigsShownBelow = !past && !!myDay?.gigs.length;
  const bookedShownBelow = gigsShownBelow && !!day.booked;

  return (
    <div>
      {day.booked && !bookedShownBelow && (
        <div className="mb-5 rounded-2xl border border-line bg-bg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <GigDetails gig={day.booked} />
          <Link
            href={`/gigs/${day.booked.id}`}
            className="mt-4 block rounded-full bg-surface py-2 text-center text-[13px] font-medium transition-colors duration-200 hover:bg-line"
          >
            Edit details
          </Link>
        </div>
      )}

      {day.out.length === 0 && day.otherBooked && !gigsShownBelow && (
        <div className="mb-6 rounded-2xl bg-surface px-4 py-3">
          {day.otherBandIds.map((id) => (
            <p key={id} className="flex items-center gap-1.5 text-[14px]">
              <span className="size-2 rounded-full" style={{ background: bandColor(id) }} />
              {bands.find((b) => b.id === id)?.name} has a gig
            </p>
          ))}
        </div>
      )}

      {day.out.length > 0 && (
        <div className="mb-6 divide-y divide-line rounded-2xl bg-surface">
          {day.out.map((o) => (
            <div key={o.why} className="px-4 py-3">
              <p className="text-[15px] font-medium">{o.who}</p>
              <p className="flex items-center gap-1.5 text-[13px] text-muted">
                {o.bandId && (
                  <span className="size-2 rounded-full" style={{ background: bandColor(o.bandId) }} />
                )}
                {o.why}
              </p>
            </div>
          ))}
        </div>
      )}

      {manager ? (
        !past && (
          <>
            {!day.booked && (
              <p className="mb-3 text-[13px] text-muted">
                {day.verdict === "conflict" ? "Book anyway" : "Book"} {bandName}, or pick another band to
                block the day for its members. Details are optional.
              </p>
            )}
            <DayForm
              gigBandIds={allBandIds}
              key={`${day.date}-${myDay?.gigs.length}`}
              personId={personId}
              date={day.date}
              day={myDay}
              bands={bands}
              myBandIds={myBandIds}
              initialBandId={bandId}
              gigOnly
              onDone={onDone}
            />
          </>
        )
      ) : (
        <>
          <h3 className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">Your day</h3>
          <DayForm
            gigBandIds={allBandIds}
            key={`${day.date}-${myDay?.mark?.status}-${myDay?.gigs.length}`}
            personId={personId}
            date={day.date}
            day={myDay}
            bands={bands}
            myBandIds={myBandIds}
            initialBandId={bandId}
            onDone={onDone}
          />
        </>
      )}
    </div>
  );
}

function Cell({
  day,
  today,
  bandId,
  selected,
  focused,
  onPick,
}: {
  day: BandBoardDay;
  today: string;
  bandId: string;
  selected: boolean;
  /** In the desktop panel by default (today) without being tapped. */
  focused: boolean;
  onPick: () => void;
}) {
  const past = day.date < today;
  const isToday = day.date === today;
  const color = bandColor(bandId);
  // Open days are tinted green, not labelled. A day someone is out of, or another
  // band is playing, is grey: taken, at a glance.
  const taken = !day.booked && (day.verdict === "conflict" || day.otherBooked);
  const open = !past && !day.booked && !taken && day.verdict === "works";

  const phone = day.booked
    ? "font-semibold text-white"
    : taken
      ? "bg-surface text-muted"
      : day.verdict === "works"
        ? "bg-ok-tint font-semibold text-ok"
        : "border-[1.5px] border-dashed border-fg/45";

  return (
    <button
      onClick={onPick}
      aria-pressed={selected}
      aria-label={`${longDate(day.date)}: ${headline(day, "the band")}`}
      className={`flex w-full flex-col items-center md:h-full md:min-h-[112px] md:items-stretch md:p-2 md:text-left md:transition-[background-color,box-shadow] md:duration-200 ${
        open
          ? "md:bg-ok-tint/70 md:hover:bg-ok-tint"
          : taken
            ? "md:bg-surface md:hover:bg-line/60"
            : "md:hover:bg-surface/60"
      } ${
        selected
          ? "md:shadow-[inset_0_0_0_2px_var(--fg)]"
          : focused
            ? "lg:shadow-[inset_0_0_0_1.5px_var(--fg)]"
            : ""
      } ${past ? "opacity-35" : ""}`}
    >
      <span
        className={`grid size-11 place-items-center rounded-full text-[15px] md:hidden ${phone} ${selected ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : ""}`}
        style={day.booked ? { background: color } : undefined}
      >
        {dayOfMonth(day.date)}
      </span>
      <span aria-hidden className={`mt-0.5 size-1 rounded-full md:hidden ${isToday ? "bg-fg" : ""}`} />

      <span
        className={`hidden size-7 place-items-center rounded-full text-[14px] md:grid ${
          isToday
            ? "bg-fg font-semibold text-bg"
            : open
              ? "font-semibold text-ok"
              : taken
                ? "font-medium text-muted"
                : "font-medium"
        }`}
      >
        {dayOfMonth(day.date)}
      </span>
      <span className="mt-1.5 hidden min-w-0 flex-col gap-1 md:flex">
        {day.booked && <GigChip color={color} label={`${day.booked.bandAbbr} booked`} gig={day.booked} />}
        {!day.booked && !past && (
          <>
            {day.otherGigs.map((g) => (
              <GigChip key={g.id} color={bandColor(g.bandId)} label={`${g.bandAbbr} booked`} gig={g} />
            ))}
            {/* One line per person: "Brando out", "Mike maybe". Rarely more than two. */}
            {people(day).map((p) => (
              <span
                key={p.name}
                className="flex min-w-0 items-center gap-1.5 px-0.5 text-[11px] leading-tight text-muted"
              >
                <span
                  aria-hidden
                  className={`size-2 shrink-0 rounded-full ${
                    p.maybe ? "border border-dashed border-fg/50" : "bg-faint"
                  }`}
                />
                <span className="truncate">
                  {p.name} {p.maybe ? "maybe" : "out"}
                </span>
              </span>
            ))}
          </>
        )}
      </span>
    </button>
  );
}

/**
 * Members out (or a maybe) for reasons other than a band gig — gig conflicts
 * show as "JT booked" chips instead.
 */
const people = (d: BandBoardDay) =>
  d.out
    .filter((o) => !o.bandId)
    .flatMap((o) => o.who.split(", ").map((name) => ({ name, maybe: o.why.startsWith("Maybe") })));
