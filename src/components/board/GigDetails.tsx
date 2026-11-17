import type { ReactNode } from "react";
import type { GigChip as Gig } from "@/lib/board";
import { timeRange } from "@/lib/dates";
import { bandColor } from "@/lib/view";

/**
 * Everything known about a gig. `compact` is the hover tooltip: same facts,
 * tighter, and nothing to click (the tooltip can't be reached by the pointer).
 */
export function GigDetails({
  gig,
  compact = false,
  aside,
}: {
  gig: Gig;
  compact?: boolean;
  /** Extra line under the title, e.g. "not your band". */
  aside?: ReactNode;
}) {
  const when = timeRange(gig.startTime, gig.endTime);
  const text = compact ? "text-[12px]" : "text-[14px]";

  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: bandColor(gig.bandId) }}
        />
        <p className={`${compact ? "text-[13px]" : "text-[16px]"} font-semibold tracking-tight`}>
          {gig.bandName}
        </p>
      </div>
      {aside && (
        <p className={`mt-0.5 pl-[18px] ${compact ? "text-[11px]" : "text-[13px]"} text-muted`}>{aside}</p>
      )}

      <dl className={`mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 ${text}`}>
        <Row label="Time">{when ?? <Faint>Not set</Faint>}</Row>
        <Row label="Venue">{gig.venue ?? <Faint>Not set</Faint>}</Row>
        {gig.address && (
          <Row label="Address">
            {compact ? (
              gig.address
            ) : (
              <a
                href={`https://maps.apple.com/?q=${encodeURIComponent(gig.address)}`}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-faint underline-offset-2 hover:decoration-fg"
              >
                {gig.address}
              </a>
            )}
          </Row>
        )}
        {gig.url && !compact && (
          <Row label="Link">
            <a
              href={gig.url}
              target="_blank"
              rel="noreferrer"
              className="break-all underline decoration-faint underline-offset-2 hover:decoration-fg"
            >
              {gig.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>
          </Row>
        )}
        {gig.note && <Row label="Notes">{gig.note}</Row>}
        {gig.players.length > 0 && <Row label="Playing">{gig.players.join(", ")}</Row>}
        {gig.bookedBy && !compact && <Row label="Booked by">{gig.bookedBy}</Row>}
      </dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

const Faint = ({ children }: { children: ReactNode }) => <span className="text-faint">{children}</span>;
