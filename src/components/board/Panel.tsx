"use client";

import { useEffect, type ReactNode } from "react";

/**
 * The day panel's frame. On desktop it is a sticky column beside the
 * calendar; below `lg` it is a bottom sheet over a dimmed page.
 */
export function Panel({
  open,
  onClose,
  title,
  sub,
  children,
  empty,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  /** What the desktop column shows when nothing is picked. */
  empty: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <button
          aria-label="Close"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        className={
          open
            ? "fixed inset-x-0 bottom-0 z-40 max-h-[88dvh] overflow-y-auto rounded-t-[28px] bg-bg px-5 pt-3 pb-8 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] lg:sticky lg:top-20 lg:z-0 lg:max-h-[calc(100dvh-6rem)] lg:rounded-3xl lg:border lg:border-line lg:p-6 lg:shadow-none"
            : "hidden lg:sticky lg:top-20 lg:block lg:rounded-3xl lg:border lg:border-line lg:p-6"
        }
      >
        {open ? (
          <>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line lg:hidden" />
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[22px] leading-tight font-semibold tracking-tight">{title}</h2>
                {sub && <p className="mt-1 text-[14px] text-muted">{sub}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-muted transition-colors duration-200 hover:text-fg"
              >
                ✕
              </button>
            </div>
            {children}
          </>
        ) : (
          empty
        )}
      </aside>
    </>
  );
}
