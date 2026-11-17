import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DatesBoard } from "@/components/board/DatesBoard";
import { MonthBar } from "@/components/board/MonthBar";
import { Page, Skeleton } from "@/components/ui";
import { bandRange } from "@/lib/availability";
import { bandMonth, memberMonth } from "@/lib/board";
import { addMonths, ISO_MONTH, monthBounds, todayISO } from "@/lib/dates";
import { findMe, isManager, ME_COOKIE } from "@/lib/me";
import { DEFAULT_BAND_ID } from "@/lib/seed";
import { getCalendar } from "@/lib/store";
import { bandOf, bandShort } from "@/lib/view";

export default function DatesPage(props: PageProps<"/dates">) {
  return (
    <Page wide>
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
        <Dates {...props} />
      </Suspense>
    </Page>
  );
}

/**
 * The WMH scheduler: which days work for Whiskey Mountain Highway, and — for
 * a member — their own day too. Other bands' gigs are added from here too,
 * because they take WMH members out; there is no band switcher (Adam,
 * 2026-11-16).
 */
async function Dates({ searchParams }: PageProps<"/dates">) {
  const q = await searchParams;
  // proxy.ts already sends anyone unpicked to "/"; this is the belt to its braces.
  const me = findMe((await cookies()).get(ME_COOKIE)?.value);
  if (!me) redirect("/");
  const cal = await getCalendar();
  const today = todayISO();

  const bandId = DEFAULT_BAND_ID;
  const month = typeof q.month === "string" && ISO_MONTH.test(q.month) ? q.month : today.slice(0, 7);
  const href = (o: { month: string }) => `/dates?month=${o.month}`;

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
      monthBar={
        <MonthBar
          month={month}
          prevHref={href({ month: addMonths(month, -1) })}
          nextHref={href({ month: addMonths(month, 1) })}
          todayHref={href({ month: today.slice(0, 7) })}
        />
      }
      summary={
        end < today ? (
          "This month has passed."
        ) : (
          <>
            <span className="font-medium text-fg">
              {open} open {open === 1 ? "date" : "dates"}
            </span>{" "}
            for {band?.name}
            {month === today.slice(0, 7) ? " for the rest of the month" : " this month"}.
          </>
        )
      }
    />
  );
}
