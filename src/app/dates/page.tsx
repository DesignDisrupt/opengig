import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { bookDate } from "@/app/actions";
import { DateTile, MonthNav, Page, Rows, Segmented, Skeleton, Title } from "@/components/ui";
import { DatesBoard } from "@/components/board/DatesBoard";
import { bandRange, type Calendar } from "@/lib/availability";
import { bandMonth } from "@/lib/board";
import { findMe, ME_COOKIE } from "@/lib/me";
import { ISO_MONTH, monthBounds, monthLabel, shortDate, todayISO } from "@/lib/dates";
import { DEFAULT_BAND_ID } from "@/lib/seed";
import { getCalendar } from "@/lib/store";
import type { BandDay, Gig } from "@/lib/types";
import { bandColor, bandOf, bandShort, describe, gigSummary, personName } from "@/lib/view";

export default function DatesPage(props: PageProps<"/dates">) {
  return (
    <Page wide>
      <Title>Booking Dates</Title>
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
        <Dates {...props} />
      </Suspense>
    </Page>
  );
}

/** Calendar is the default; the two lists are the earlier phone-first views. */
type Show = "calendar" | "open" | "all";

async function Dates({ searchParams }: PageProps<"/dates">) {
  const q = await searchParams;
  // proxy.ts already sends anyone unpicked to "/"; this is the belt to its braces.
  const me = findMe((await cookies()).get(ME_COOKIE)?.value);
  if (!me) redirect("/");
  const cal = await getCalendar();
  const today = todayISO();

  const bandId =
    typeof q.band === "string" && cal.bands.some((b) => b.id === q.band) ? q.band : DEFAULT_BAND_ID;
  const month = typeof q.month === "string" && ISO_MONTH.test(q.month) ? q.month : today.slice(0, 7);
  const show: Show = q.show === "all" || q.show === "open" ? q.show : "calendar";
  const href = (o: { band?: string; month?: string; show?: Show }) =>
    `/dates?band=${o.band ?? bandId}&month=${o.month ?? month}&show=${o.show ?? show}`;

  const { start, end } = monthBounds(month);
  const days = bandRange(cal, bandId, start < today ? today : start, end); // past days drop out

  const booked = (d: BandDay) => cal.gigs.filter((g) => g.bandId === bandId && g.date === d.date);
  const isOpen = (d: BandDay) => d.verdict !== "conflict" && !booked(d).length;
  const open = days.filter(isOpen).length;
  const visible = show === "open" ? days.filter(isOpen) : days;
  const band = bandOf(cal, bandId);

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented
          className="md:w-[420px]"
          items={cal.bands.map((b) => ({
            key: b.id,
            href: href({ band: b.id }),
            active: b.id === bandId,
            label: (
              <>
                <span className="size-1.5 rounded-full" style={{ background: bandColor(b.id) }} />
                {bandShort(b.id)}
              </>
            ),
          }))}
        />
        <Segmented
          className="md:w-[340px]"
          items={[
            {
              key: "calendar",
              href: href({ show: "calendar" }),
              active: show === "calendar",
              label: "Calendar",
            },
            { key: "open", href: href({ show: "open" }), active: show === "open", label: "Open dates" },
            { key: "all", href: href({ show: "all" }), active: show === "all", label: "Every day" },
          ]}
        />
      </div>

      <MonthNav month={month} href={(m) => href({ month: m })} />
      <p className="mb-5 text-[15px] text-muted">
        {end < today ? (
          "This month has passed."
        ) : (
          <>
            <span className="font-medium text-fg">
              {open} open {open === 1 ? "date" : "dates"}
            </span>{" "}
            for {band?.name}
            {month === today.slice(0, 7) ? " for the rest of the month" : ""}.
          </>
        )}
      </p>

      {show === "calendar" ? (
        <DatesBoard
          weeks={bandMonth(cal, bandId, month)}
          today={today}
          month={month}
          bandId={bandId}
          bandName={band?.name ?? ""}
          personId={me.id}
          bands={cal.bands.map((b) => ({ id: b.id, name: b.name, short: bandShort(b.id) }))}
          myBandIds={cal.bands.filter((b) => b.memberIds.includes(me.id)).map((b) => b.id)}
        />
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-[15px] text-muted">
          {end < today ? "" : `No open dates in ${monthLabel(month)}.`}
        </p>
      ) : (
        <div className="max-w-2xl">
          <Rows>
            {visible.map((d) => (
              <DayRow key={d.date} cal={cal} day={d} bandId={bandId} booked={booked(d)} />
            ))}
          </Rows>
        </div>
      )}
    </>
  );
}

function DayRow({
  cal,
  day,
  bandId,
  booked,
}: {
  cal: Calendar;
  day: BandDay;
  bandId: string;
  booked: Gig[];
}) {
  if (booked.length) {
    return (
      <Link
        href={`/gigs/${booked[0].id}`}
        className="flex items-center gap-4 py-3.5 transition-colors duration-200 hover:bg-surface/60"
      >
        <DateTile date={day.date} tone={bandColor(bandId)} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium">Booked</span>
          <span className="block truncate text-[13px] text-muted">{gigSummary(booked[0])}</span>
        </span>
        <span aria-hidden className="pr-1 text-faint">
          ›
        </span>
      </Link>
    );
  }

  // Group who is out by why: "Jacob, Brando, Cade — Gig with Loveyoubye".
  const reasons = new Map<string, string[]>();
  for (const m of day.members) {
    if (m.status === "free") continue;
    const why = describe(cal, m);
    reasons.set(why, [...(reasons.get(why) ?? []), personName(m.personId)]);
  }
  const open = day.verdict !== "conflict";

  return (
    <div className="flex items-center gap-4 py-3.5">
      <DateTile date={day.date} tone={day.verdict === "works" ? "var(--ok)" : undefined} />
      <div className="min-w-0 flex-1">
        {day.verdict === "works" ? (
          <p className="text-[15px] font-medium text-ok">Everyone’s free</p>
        ) : (
          <p className={`text-[15px] font-medium ${open ? "" : "text-muted"}`}>
            {open ? "Free, with a maybe" : "Not everyone"}
          </p>
        )}
        {[...reasons].map(([why, who]) => (
          <p key={why} className="truncate text-[13px] text-muted">
            {who.join(", ")} · {why}
          </p>
        ))}
      </div>
      {open && (
        <form action={bookDate}>
          <input type="hidden" name="bandId" value={bandId} />
          <input type="hidden" name="date" value={day.date} />
          <button
            type="submit"
            className="h-9 rounded-full bg-surface px-4 text-[13px] font-medium transition-colors duration-200 hover:bg-fg hover:text-bg"
            aria-label={`Book ${bandOf(cal, bandId)?.name} on ${shortDate(day.date)}`}
          >
            Book
          </button>
        </form>
      )}
    </div>
  );
}
