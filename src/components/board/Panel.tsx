"use client";

import { useEffect, type ReactNode } from "react";

/**
 * The day panel's frame. On desktop it is always there, a sticky column
 * beside the calendar showing whatever day is in focus (today until you pick
 * another). Below `lg` it is a bottom sheet that appears only when you tap a
 * day, so it never sits on top of the calendar uninvited.
 */
export function Panel({
  sheetOpen,
  onClose,
  title,
  sub,
  children,
}: {
  /** Phone/tablet: whether the sheet is up. Desktop ignores it. */
  sheetOpen: boolean;
  /** Dismiss the sheet / return the desktop column to today. */
  onClose: () => void;
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen, onClose]);

  return (
    <>
      {sheetOpen && (
        <button
          aria-label="Close"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        className={`${
          sheetOpen
            ? "fixed inset-x-0 bottom-0 z-40 max-h-[88dvh] overflow-y-auto rounded-t-[28px] bg-bg px-5 pt-3 pb-8 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
            : "hidden"
        } lg:sticky lg:top-20 lg:z-0 lg:block lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:rounded-3xl lg:border lg:border-line lg:bg-bg lg:p-6 lg:shadow-none`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line lg:hidden" />
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[22px] leading-tight font-semibold tracking-tight">{title}</h2>
            {sub && <p className="mt-1 text-[14px] text-muted">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`grid size-9 shrink-0 place-items-center rounded-full bg-surface text-muted transition-colors duration-200 hover:text-fg ${
              sheetOpen ? "" : "lg:hidden"
            }`}
          >
            ✕
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
