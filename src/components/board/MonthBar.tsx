import Link from "next/link";
import { monthLabel } from "@/lib/dates";

/**
 * "December 2026 · Today ‹ ›" — the month paging both calendars use, so
 * My Calendar and Booking Dates page through months the same way.
 */
export function MonthBar({
  month,
  prevHref,
  nextHref,
  todayHref,
}: {
  month: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[18px] font-semibold tracking-tight lg:text-[20px]">{monthLabel(month)}</h2>
      <div className="flex items-center gap-1">
        <Link
          href={todayHref}
          scroll={false}
          className="mr-1 rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-fg"
        >
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
  );
}

const arrow =
  "grid size-9 place-items-center rounded-full text-lg text-muted transition-colors duration-200 hover:bg-surface hover:text-fg";
