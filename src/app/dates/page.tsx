import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DatesBoard } from "@/components/board/DatesBoard";
import { MonthNav, Page, Segmented, Skeleton, Title } from "@/components/ui";
import { bandRange } from "@/lib/availability";
import { bandMonth, memberMonth } from "@/lib/board";
import { ISO_MONTH, monthBounds, todayISO } from "@/lib/dates";
import { findMe, isManager, ME_COOKIE } from "@/lib/me";
import { DEFAULT_BAND_ID } from "@/lib/seed";
import { getCalendar } from "@/lib/store";
import { bandColor, bandOf, bandShort } from "@/lib/view";

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

/** One calendar: which days work for a band, and — for a member — their own day too. */
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
  const href = (o: { band?: string; month?: string }) =>
    `/dates?band=${o.band ?? bandId}&month=${o.month ?? month}`;

  const { start, end } = monthBounds(month);
  const open = bandRange(cal, bandId, start < today ? today : start, end).filter(
    (d) => d.verdict !== "conflict" && !cal.gigs.some((g) => g.bandId === bandId && g.date === d.date),
  ).length;
  const band = bandOf(cal, bandId);
  const manager = isManager(me);

  return (
    <DatesBoard
      weeks={bandMonth(cal, bandId, month)}
      myWeeks={memberMonth(cal, me.id, month, manager)}
      manager={manager}
      today={today}
      month={month}
      bandId={bandId}
      bandName={band?.name ?? ""}
      personId={me.id}
      bands={cal.bands.map((b) => ({ id: b.id, name: b.name, short: bandShort(b.id) }))}
      myBandIds={cal.bands.filter((b) => b.memberIds.includes(me.id)).map((b) => b.id)}
      bandSwitch={
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
      }
      monthBar={
        <>
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
        </>
      }
    />
  );
}
