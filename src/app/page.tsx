import Link from "next/link";
import { Suspense } from "react";
import { BandDot, DateTile, Page, Rows, SectionLabel, Skeleton, Title } from "@/components/ui";
import { monthLabel, todayISO } from "@/lib/dates";
import { BANDS, PEOPLE } from "@/lib/seed";
import { getCalendar } from "@/lib/store";
import { bandColor, bandOf, gigSummary } from "@/lib/view";

export default function Home() {
  return (
    <Page>
      <Title sub="Pick your name to mark the days you can’t make.">Who’s this?</Title>

      <Rows>
        {PEOPLE.map((p) => (
          <Link
            key={p.id}
            href={`/m/${p.id}`}
            className="flex items-center gap-4 py-3 transition-colors duration-200 hover:bg-surface/60"
          >
            <span className="grid size-10 place-items-center rounded-full bg-surface text-[14px] font-semibold">
              {p.name.slice(0, 2)}
            </span>
            <span className="flex-1 text-[16px] font-medium">{p.name}</span>
            <span className="flex gap-1">
              {BANDS.filter((b) => b.memberIds.includes(p.id)).map((b) => (
                <BandDot key={b.id} bandId={b.id} />
              ))}
            </span>
            <span aria-hidden className="pr-1 text-faint">›</span>
          </Link>
        ))}
      </Rows>

      <Suspense fallback={<Skeleton className="mt-12 h-64" />}>
        <UpcomingGigs />
      </Suspense>
    </Page>
  );
}

async function UpcomingGigs() {
  const cal = await getCalendar();
  const today = todayISO();
  const upcoming = cal.gigs
    .filter((g) => g.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  if (!upcoming.length) return null;

  // Group by month, like an agenda.
  const months = new Map<string, typeof upcoming>();
  for (const g of upcoming) {
    const m = g.date.slice(0, 7);
    months.set(m, [...(months.get(m) ?? []), g]);
  }

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-[20px] font-semibold tracking-tight">Coming up</h2>
      {[...months].map(([month, gigs]) => (
        <div key={month} className="mb-6">
          <SectionLabel>{monthLabel(month)}</SectionLabel>
          <Rows>
            {gigs.map((g) => (
              <Link
                key={g.id}
                href={`/gigs/${g.id}`}
                className="flex items-center gap-4 py-3.5 transition-colors duration-200 hover:bg-surface/60"
              >
                <DateTile date={g.date} tone={bandColor(g.bandId)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">
                    {bandOf(cal, g.bandId)?.name}
                  </span>
                  <span className="block truncate text-[13px] text-muted">{gigSummary(g)}</span>
                </span>
                <span aria-hidden className="pr-1 text-faint">›</span>
              </Link>
            ))}
          </Rows>
        </div>
      ))}
    </section>
  );
}
