import type { ReactNode } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * The month grid both calendars draw into.
 *
 * Phone: no lines, round day markers (each cell decides its own look).
 * md and up: one continuous hairline grid — weekday header row, shared
 * borders, and days outside the month hatched — rather than separate boxes.
 */
export function CalendarGrid<T extends { date: string }>({
  weeks,
  cell,
}: {
  weeks: (T | null)[][];
  cell: (day: T) => ReactNode;
}) {
  return (
    <div className="md:overflow-hidden md:rounded-2xl md:border md:border-line md:bg-bg">
      <div className="grid grid-cols-7 pb-2 text-center text-[11px] font-medium text-faint md:border-b md:border-line md:bg-surface/50 md:pb-0 md:text-left">
        {WEEKDAYS.map((d) => (
          <span key={d} className="md:px-3 md:py-2.5 md:tracking-[0.06em] md:uppercase">
            <span className="md:hidden">{d[0]}</span>
            <span className="hidden md:inline">{d}</span>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1.5 md:gap-0">
        {weeks.flat().map((d, i) => (
          <div
            key={d?.date ?? `pad-${i}`}
            className={`md:min-h-[112px] md:border-t md:border-l md:border-line md:[&:nth-child(-n+7)]:border-t-0 md:[&:nth-child(7n+1)]:border-l-0 ${
              d ? "" : "md:bg-[repeating-linear-gradient(135deg,var(--surface)_0_1px,transparent_1px_8px)]"
            }`}
          >
            {d && cell(d)}
          </div>
        ))}
      </div>
    </div>
  );
}
