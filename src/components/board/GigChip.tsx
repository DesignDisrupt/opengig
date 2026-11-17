"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GigChip as Gig } from "@/lib/board";
import { GigDetails } from "./GigDetails";

const TIP_WIDTH = 280;
const GAP = 6;

/**
 * "● WMH booked" in a desktop calendar cell — outlined, with a soft shadow so
 * it sits on the day like a card. Hovering it shows the gig's details.
 *
 * The tooltip is portalled to <body> and positioned against the viewport, so
 * the grid's rounded clipping can't cut it off, and it flips above the chip
 * when there isn't room below.
 */
export function GigChip({ color, label, gig }: { color: string; label: string; gig?: Gig }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState<{ left: number; top?: number; bottom?: number } | null>(null);

  // Any scroll moves the chip out from under its tooltip; just close it.
  useEffect(() => {
    if (!tip) return;
    const close = () => setTip(null);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [tip]);

  function show() {
    const el = ref.current;
    if (!el || !gig) return;
    const r = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - TIP_WIDTH - 8));
    const roomBelow = window.innerHeight - r.bottom;
    setTip(
      roomBelow > 240 ? { left, top: r.bottom + GAP } : { left, bottom: window.innerHeight - r.top + GAP },
    );
  }

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => setTip(null)}
        className="flex min-w-0 items-center gap-1.5 rounded-md border border-line bg-bg px-1.5 py-1 text-[11px] leading-tight font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_2px_6px_rgba(0,0,0,0.10)]"
      >
        <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="truncate">{label}</span>
      </span>
      {tip &&
        gig &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-50 rounded-2xl border border-line bg-bg p-4 text-left shadow-[0_12px_32px_-8px_rgba(0,0,0,0.22)]"
            style={{ width: TIP_WIDTH, left: tip.left, top: tip.top, bottom: tip.bottom }}
          >
            <GigDetails gig={gig} compact />
          </div>,
          document.body,
        )}
    </>
  );
}
