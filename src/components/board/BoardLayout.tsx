import type { ReactNode } from "react";

/**
 * The one page pattern both calendars share, so nothing moves when you switch
 * between My Calendar and Booking Dates:
 *
 *   Title ............................................ [actions]
 *   summary
 *   [toolbar — Booking Dates' band switcher]
 *   ┌ month bar ───────────────────────┐  ┌ day panel ┐
 *   │ calendar grid                    │  │           │
 *   └ legend ──────────────────────────┘  └───────────┘
 *
 * The panel starts level with the month bar on both pages.
 */
export function BoardLayout({
  title,
  summary,
  actions,
  toolbar,
  monthBar,
  panel,
  children,
}: {
  title: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  monthBar: ReactNode;
  panel: ReactNode;
  /** The grid and its legend. */
  children: ReactNode;
}) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] lg:text-[34px]">{title}</h1>
          {summary && <p className="mt-1 text-[15px] text-muted">{summary}</p>}
        </div>
        {actions && <div className="flex w-full gap-2 sm:w-auto">{actions}</div>}
      </div>

      {toolbar && <div className="mb-6">{toolbar}</div>}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        <div>
          {monthBar}
          {children}
        </div>
        {panel}
      </div>
    </>
  );
}

/** The header buttons: "Block dates" (quiet) and "+ Add gig" (primary). */
export const actionButton =
  "inline-flex h-11 flex-1 items-center justify-center rounded-full px-5 text-[14px] font-medium whitespace-nowrap transition-colors duration-200 sm:flex-none";
export const quietAction = `${actionButton} bg-surface hover:bg-line`;
export const primaryAction = `${actionButton} bg-fg text-bg hover:opacity-85`;
