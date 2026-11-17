import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BandDot, DateTile, MonthNav, Page, Rows, SectionLabel, Skeleton, Title } from "@/components/ui";
import { personDay } from "@/lib/availability";
import { dayOfMonth, eachDayOf, ISO_MONTH, monthBounds, monthGrid, todayISO } from "@/lib/dates";
import { getCalendar } from "@/lib/store";
import type { Band, PersonDay } from "@/lib/types";
import { bandColor, bandShort, bandsFor, describe, findPerson } from "@/lib/view";

export default function MemberPage(props: PageProps<"/m/[personId]">) {
  return (
    <Page>
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
        <MemberCalendar {...props} />
      </Suspense>
    </Page>
  );
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

async function MemberCalendar({ params, searchParams }: PageProps<"/m/[personId]">) {
  const { personId } = await params;
  const person = findPerson(personId);
  if (!person) notFound();

  const q = await searchParams;
  const cal = await getCalendar();
  const today = todayISO();
  const month = typeof q.month === "string" && ISO_MONTH.test(q.month) ? q.month : today.slice(0, 7);
  const bands = bandsFor(cal, personId);

  const { start, end } = monthBounds(month);
  const marked = eachDayOf(start, end)
    .map((date) => ({ date, day: personDay(cal, personId, date) }))
    .filter(({ day }) => day.status !== "free");

  return (
    <>
      <Title sub="Every day is free. Tap the ones you can’t make.">{person.name}</Title>

      <MonthNav month={month} href={(m) => `/m/${personId}?month=${m}`} />

      <div className="grid grid-cols-7 py-2 text-center text-[11px] font-medium text-faint">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1.5">
        {monthGrid(month)
          .flat()
          .map((date, i) =>
            date ? (
              <DayCell
                key={date}
                href={`/m/${personId}/${date}`}
                date={date}
                day={personDay(cal, personId, date)}
                isToday={date === today}
                isPast={date < today}
              />
            ) : (
              <span key={i} />
            ),
          )}
      </div>

      <section className="mt-10">
        <SectionLabel>Can’t make it</SectionLabel>
        {marked.length === 0 ? (
          <p className="py-4 text-[15px] text-muted">Free all month.</p>
        ) : (
          <Rows>
            {marked.map(({ date, day }) => (
              <Link
                key={date}
                href={`/m/${personId}/${date}`}
                className="flex items-center gap-4 py-3.5 transition-colors duration-200 hover:bg-surface/60"
              >
                <DateTile date={date} tone={gigTone(day)} />
                <span className="min-w-0 flex-1 truncate text-[15px]">{describe(cal, day)}</span>
                <span aria-hidden className="pr-1 text-faint">›</span>
              </Link>
            ))}
          </Rows>
        )}
      </section>

      <Legend bands={bands} />
    </>
  );
}

const gigTone = (day: PersonDay) =>
  day.status === "busy" && day.reason === "gig" ? bandColor(day.gigs[0].bandId) : undefined;

/**
 * One day in the grid. Shape, not hue, tells the states apart:
 * band gig = filled in the band's colour, busy = grey disc with the number
 * struck, maybe = dashed ring, free = nothing.
 */
function DayCell({
  href,
  date,
  day,
  isToday,
  isPast,
}: {
  href: string;
  date: string;
  day: PersonDay;
  isToday: boolean;
  isPast: boolean;
}) {
  const gig = day.status === "busy" && day.reason === "gig" ? day.gigs[0] : null;
  const look = gig
    ? "text-white font-semibold"
    : day.status === "busy"
      ? "bg-surface text-muted line-through decoration-1"
      : day.status === "maybe"
        ? "border-[1.5px] border-dashed border-fg/45"
        : "hover:bg-surface";

  return (
    <Link href={href} className={`flex flex-col items-center ${isPast ? "opacity-35" : ""}`}>
      <span
        className={`grid size-11 place-items-center rounded-full text-[15px] transition-colors duration-200 ${look}`}
        style={gig ? { background: bandColor(gig.bandId) } : undefined}
      >
        {dayOfMonth(date)}
      </span>
      <span
        aria-hidden
        className={`mt-0.5 size-1 rounded-full ${isToday ? "bg-fg" : "bg-transparent"}`}
      />
    </Link>
  );
}

/** A floating pill key, only for the bands this person is on. */
function Legend({ bands }: { bands: Band[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-10 flex justify-center px-5">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-fg/90 px-3.5 py-2 text-[11.5px] whitespace-nowrap text-bg shadow-lg backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border border-dashed border-bg/80" /> Maybe
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-bg/45" /> Busy
        </span>
        {bands.map((b) => (
          <span key={b.id} className="flex items-center gap-1.5">
            <BandDot bandId={b.id} className="size-2.5" /> {bandShort(b.id)}
          </span>
        ))}
      </div>
    </div>
  );
}
