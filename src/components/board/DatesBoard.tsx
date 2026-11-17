"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { bookDate } from "@/app/actions";
import type { BandBoardDay } from "@/lib/board";
import { dayOfMonth, longDate } from "@/lib/dates";
import { bandColor } from "@/lib/view";
import { Panel } from "./Panel";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Dates that work" as a month grid: green works, dashed maybe, faded conflict, filled booked. */
export function DatesBoard({
  weeks,
  today,
  bandId,
  bandName,
}: {
  weeks: (BandBoardDay | null)[][];
  today: string;
  bandId: string;
  bandName: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const close = useCallback(() => setPicked(null), []);
  const day = weeks.flat().find((d) => d?.date === picked) ?? undefined;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
      <div>
        <div className="grid grid-cols-7 pb-2 text-center text-[11px] font-medium text-faint md:text-left md:text-[12px]">
          {WEEKDAYS.map((d) => (
            <span key={d} className="md:px-2">
              <span className="md:hidden">{d[0]}</span>
              <span className="hidden md:inline">{d}</span>
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1.5 md:gap-1.5">
          {weeks.flat().map((d, i) =>
            d ? (
              <Cell key={d.date} day={d} today={today} bandId={bandId} selected={picked === d.date} onPick={() => setPicked(d.date)} />
            ) : (
              <span key={i} className="md:min-h-[96px]" />
            ),
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-ok-tint ring-1 ring-ok/40" /> Everyone free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-dashed border-fg/50" /> Someone’s a maybe
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: bandColor(bandId) }} /> Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-faint/50" /> Not everyone
          </span>
        </div>
      </div>

      <Panel
        open={!!day}
        onClose={close}
        title={day ? longDate(day.date).replace(/, \d{4}$/, "") : ""}
        sub={day ? headline(day, bandName) : undefined}
        empty={
          <div className="py-6 text-center">
            <p className="text-[17px] font-semibold tracking-tight">Pick a date</p>
            <p className="mx-auto mt-1 max-w-[240px] text-[14px] text-muted">
              See who’s out and why, and book {bandName} on any open day.
            </p>
          </div>
        }
      >
        {day && <DayDetail day={day} bandId={bandId} bandName={bandName} past={day.date < today} />}
      </Panel>
    </div>
  );
}

function headline(d: BandBoardDay, bandName: string) {
  if (d.booked) return `${bandName} is booked`;
  if (d.verdict === "works") return "Everyone’s free";
  if (d.verdict === "maybe") return "Free, with a maybe";
  return "Not everyone can make it";
}

function DayDetail({ day, bandId, bandName, past }: { day: BandBoardDay; bandId: string; bandName: string; past: boolean }) {
  return (
    <div>
      {day.booked && (
        <Link
          href={`/gigs/${day.booked.id}`}
          className="mb-5 flex items-center gap-3 rounded-2xl bg-surface py-3 pr-4 pl-3 transition-colors duration-200 hover:bg-line"
        >
          <span className="h-9 w-1 rounded-full" style={{ background: bandColor(bandId) }} />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium">Gig · {bandName}</span>
            <span className="block truncate text-[13px] text-muted">{day.booked.summary}</span>
          </span>
          <span className="text-[13px] text-muted">Open ›</span>
        </Link>
      )}

      {day.out.length > 0 && (
        <div className="mb-5 divide-y divide-line rounded-2xl bg-surface">
          {day.out.map((o) => (
            <div key={o.why} className="px-4 py-3">
              <p className="text-[15px] font-medium">{o.who}</p>
              <p className="flex items-center gap-1.5 text-[13px] text-muted">
                {o.bandId && <span className="size-2 rounded-full" style={{ background: bandColor(o.bandId) }} />}
                {o.why}
              </p>
            </div>
          ))}
        </div>
      )}

      {!day.booked && day.verdict !== "conflict" && !past && (
        <form action={bookDate}>
          <input type="hidden" name="bandId" value={bandId} />
          <input type="hidden" name="date" value={day.date} />
          <button
            type="submit"
            className="h-[52px] w-full rounded-full bg-fg text-[15px] font-medium text-bg transition-opacity duration-200 hover:opacity-85"
          >
            Book {bandName}
          </button>
          <p className="mt-2 text-center text-[12px] text-muted">You can add time and venue next.</p>
        </form>
      )}
    </div>
  );
}

function Cell({
  day,
  today,
  bandId,
  selected,
  onPick,
}: {
  day: BandBoardDay;
  today: string;
  bandId: string;
  selected: boolean;
  onPick: () => void;
}) {
  const past = day.date < today;
  const isToday = day.date === today;
  const color = bandColor(bandId);
  // Open days are tinted, not labelled: the eye should land on what ISN'T open.
  const open = !day.booked && day.verdict === "works";

  const phone = day.booked
    ? "font-semibold text-white"
    : day.verdict === "works"
      ? "bg-ok-tint font-semibold text-ok"
      : day.verdict === "maybe"
        ? "border-[1.5px] border-dashed border-fg/45"
        : "text-faint";

  return (
    <button
      onClick={onPick}
      aria-pressed={selected}
      aria-label={`${longDate(day.date)}: ${headline(day, "the band")}`}
      className={`flex flex-col items-center md:min-h-[96px] md:items-stretch md:rounded-xl md:border md:p-2 md:text-left md:transition-colors md:duration-200 ${
        selected
          ? "md:border-fg"
          : open
            ? "md:border-transparent md:bg-ok-tint md:hover:border-ok/40"
            : "md:border-line md:hover:border-fg/30"
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
          isToday ? "bg-fg font-semibold text-bg" : open ? "font-semibold text-ok" : "font-medium"
        }`}
      >
        {dayOfMonth(day.date)}
      </span>
      <span className="mt-1.5 hidden min-w-0 md:block">
        {day.booked ? (
          <span
            className="block truncate rounded-md px-1.5 py-1 text-[11px] font-medium"
            style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
          >
            Booked
          </span>
        ) : open ? null : day.verdict === "maybe" ? (
          <span className="block truncate rounded-md border border-dashed border-fg/30 px-1.5 py-0.5 text-[11px] text-muted">Maybe</span>
        ) : (
          <span className="flex flex-wrap items-center gap-1 px-0.5 text-[11px] text-faint">
            {day.out.map((o) =>
              o.bandId ? (
                <span key={o.why} className="size-2 rounded-full" style={{ background: bandColor(o.bandId) }} />
              ) : null,
            )}
            {outCount(day)} out
          </span>
        )}
      </span>
    </button>
  );
}

const outCount = (d: BandBoardDay) => d.out.reduce((n, o) => n + o.who.split(", ").length, 0);
