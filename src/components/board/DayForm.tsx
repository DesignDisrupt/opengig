"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { quickDay, removeGig, type QuickResult } from "@/app/actions";
import type { BandOption, MemberDay } from "@/lib/board";
import { bandColor } from "@/lib/view";
import { GigDetails } from "./GigDetails";

type Mode = "free" | "maybe" | "busy" | "gig";

/** One-tap reasons for Busy. Tapping one saves straight away. */
const REASONS = ["Work", "Travel", "Family", "Out of town"];

const OPTIONS: { mode: Mode; label: string; hint: string }[] = [
  { mode: "free", label: "Free", hint: "Saves right away" },
  { mode: "maybe", label: "Maybe", hint: "Add a note" },
  { mode: "busy", label: "Busy", hint: "Pick a reason" },
  { mode: "gig", label: "Gig", hint: "Pick the band" },
];

/**
 * What a day can become: Free (one tap), Maybe, Busy with a reason, or a gig
 * for a band. Also used by the "Block dates" and "Add gig" quick actions,
 * where the date itself is editable.
 */
export function DayForm({
  personId,
  date,
  day,
  bands,
  myBandIds,
  start = "pick",
  editableDate = false,
  gigOnly = false,
  gigBandIds = [],
  initialBandId,
  onDone,
}: {
  personId: string;
  date: string;
  day?: MemberDay;
  bands: BandOption[];
  myBandIds: string[];
  /** Which option opens expanded. "pick" opens none. */
  start?: Mode | "pick";
  editableDate?: boolean;
  /** Only the Gig option — for the manager, and for booking from Dates that work. */
  gigOnly?: boolean;
  /** Offers the Gig option and gig Edit/Cancel. Only Adam and Brady book. */
  /** Bands this person may add, edit and cancel gigs for (see gigBandsFor). Empty: no Gig option. */
  gigBandIds?: string[];
  /** Band picked to start with, e.g. the band being booked. */
  initialBandId?: string;
  onDone: (r: QuickResult) => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<Mode | null>(gigOnly ? "gig" : start === "pick" ? null : start);
  const [note, setNote] = useState(day?.mark?.note ?? "");
  // Only bands this person may add gigs for; the band being booked first if allowed.
  const gigBands = bands.filter((b) => gigBandIds.includes(b.id));
  const canAddGig = gigBands.length > 0;
  const [bandId, setBandId] = useState(
    (initialBandId && gigBandIds.includes(initialBandId) ? initialBandId : undefined) ??
      gigBands.find((b) => myBandIds.includes(b.id))?.id ??
      gigBands[0]?.id,
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  // What the day is now. A gig outranks the member's own mark, so nothing is "now" then.
  const current: Mode | null = day?.gigs.some((g) => g.mine) ? null : (day?.mark?.status ?? "free");
  const options = canAddGig ? OPTIONS : OPTIONS.filter((o) => o.mode !== "gig");

  function submit(overrides: Record<string, string>) {
    if (!form.current) return;
    const fd = new FormData(form.current);
    for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
    setError(undefined);
    startTransition(async () => {
      const r = await quickDay(fd);
      if (r.ok) onDone(r);
      else setError(r.error);
    });
  }

  function pick(m: Mode) {
    if (m === "free") return submit({ mode: "free" }); // nothing to ask
    setMode(m);
  }

  const mine = gigBands.filter((b) => myBandIds.includes(b.id));
  const others = gigBands.filter((b) => !myBandIds.includes(b.id));

  return (
    <form
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        if (mode) submit({ mode });
      }}
      className={pending ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}
    >
      <input type="hidden" name="personId" value={personId} />
      <input type="hidden" name="bandId" value={bandId} />
      {!editableDate && <input type="hidden" name="date" value={date} />}

      {editableDate && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Label text={mode === "gig" ? "Date" : "From"}>
            <input type="date" name="date" defaultValue={date} required className={input} />
          </Label>
          {mode !== "gig" && (
            <Label text="To (optional)">
              <input type="date" name="endDate" className={input} />
            </Label>
          )}
        </div>
      )}

      {day && day.gigs.length > 0 && (
        <ExistingGigs day={day} gigBandIds={gigBandIds} showBusyHint={!gigOnly} onDone={onDone} />
      )}

      <div className={gigOnly ? "hidden" : `grid gap-2 ${canAddGig ? "grid-cols-4" : "grid-cols-3"}`}>
        {options.map((o) => {
          const isCurrent = !editableDate && current === o.mode;
          // Selected = the option being filled in, or — before you pick — what the day is now.
          const on = mode ? mode === o.mode : isCurrent;
          return (
            <button
              key={o.mode}
              type="button"
              onClick={() => pick(o.mode)}
              aria-pressed={on}
              className={`relative flex h-[68px] flex-col items-center justify-center gap-1 rounded-2xl text-[14px] font-medium transition-colors duration-200 ${
                on ? "bg-fg text-bg" : "bg-surface hover:bg-line"
              }`}
            >
              <OptionMark mode={o.mode} on={on} />
              {o.label}
              {isCurrent && mode && mode !== o.mode && (
                <span className="absolute top-1.5 right-2 text-[9px] font-semibold tracking-wide text-muted uppercase">
                  now
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!mode && (
        <p className="mt-3 text-center text-[13px] text-muted">
          Free saves in one tap. The others ask one more thing.
        </p>
      )}

      {mode === "busy" && (
        <Section>
          <p className="mb-2 text-[13px] text-muted">Tap a reason to save</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => submit({ mode: "busy", note: r })}
                aria-pressed={current === "busy" && day?.mark?.note === r}
                className={`h-10 rounded-full px-4 text-[14px] transition-colors duration-200 ${
                  current === "busy" && day?.mark?.note === r
                    ? "bg-fg font-medium text-bg"
                    : "bg-surface hover:bg-fg hover:text-bg"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <NoteAndSave note={note} setNote={setNote} placeholder="Or type a reason" />
        </Section>
      )}

      {mode === "maybe" && (
        <Section>
          <NoteAndSave note={note} setNote={setNote} placeholder="e.g. free after 7pm" />
        </Section>
      )}

      {mode === "gig" && (
        <Section>
          <BandPicker
            label={others.length && mine.length ? "Your bands" : "Band"}
            bands={mine.length ? mine : others}
            value={bandId}
            onChange={setBandId}
          />
          {mine.length > 0 && others.length > 0 && (
            <BandPicker label="Other bands" bands={others} value={bandId} onChange={setBandId} />
          )}
          <p className="mb-4 text-[13px] text-muted">
            Marks everyone in {bands.find((b) => b.id === bandId)?.name} busy that day.
          </p>

          <details className="group mb-5 rounded-2xl bg-surface">
            <summary className="flex list-none items-center justify-between px-4 py-3.5 text-[14px] font-medium [&::-webkit-details-marker]:hidden">
              More details
              <span className="text-[13px] font-normal text-muted">
                optional <span className="inline-block transition-transform group-open:rotate-90">›</span>
              </span>
            </summary>
            <div className="space-y-3 px-4 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <Label text="Starts">
                  <input type="time" name="startTime" className={inputOnSurface} />
                </Label>
                <Label text="Ends">
                  <input type="time" name="endTime" className={inputOnSurface} />
                </Label>
              </div>
              <Label text="Venue">
                <input name="venue" placeholder="The Roadhouse" className={inputOnSurface} />
              </Label>
              <Label text="Address">
                <input name="address" placeholder="Street, city" className={inputOnSurface} />
              </Label>
              <Label text="Link">
                <input type="url" name="url" placeholder="https://" className={inputOnSurface} />
              </Label>
              <Label text="Notes">
                <textarea
                  name="gigNote"
                  rows={2}
                  placeholder="Load-in, set length, pay…"
                  className={`${inputOnSurface} resize-none`}
                />
              </Label>
            </div>
          </details>
          <SaveButton pending={pending}>Add gig</SaveButton>
        </Section>
      )}

      {error && <p className="mt-3 text-center text-[13px] text-danger">{error}</p>}
    </form>
  );
}

function ExistingGigs({
  day,
  gigBandIds,
  showBusyHint,
  onDone,
}: {
  day: MemberDay;
  gigBandIds: string[];
  /** Members only — the manager plays in no band, so "your band" means nothing. */
  showBusyHint: boolean;
  onDone: (r: QuickResult) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  return (
    <div className="mb-5 space-y-2">
      {day.gigs.map((g) => (
        <div
          key={g.id}
          className="rounded-2xl border border-line bg-bg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <GigDetails gig={g} aside={g.mine ? undefined : "Not your band"} />
          {gigBandIds.includes(g.bandId) && (
            <div className="mt-4 flex gap-2 border-t border-line pt-3">
              <Link
                href={`/gigs/${g.id}`}
                className="flex-1 rounded-full bg-surface py-2 text-center text-[13px] font-medium transition-colors duration-200 hover:bg-line"
              >
                Edit details
              </Link>
              {/* Two clicks: cancelling frees the day for a whole band. */}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirming !== g.id) return setConfirming(g.id);
                  startTransition(async () => {
                    const fd = new FormData();
                    fd.set("id", g.id);
                    onDone(await removeGig(fd));
                  });
                }}
                onBlur={() => setConfirming(null)}
                className={`flex-1 rounded-full py-2 text-[13px] font-medium transition-colors duration-200 ${
                  confirming === g.id ? "bg-danger text-white" : "text-danger hover:bg-surface"
                }`}
              >
                {confirming === g.id ? "Sure? Cancel gig" : "Cancel gig"}
              </button>
            </div>
          )}
        </div>
      ))}
      {showBusyHint && day.gigs.some((g) => g.mine) && (
        <p className="px-1 text-[12px] text-muted">A gig with your band keeps the day busy.</p>
      )}
    </div>
  );
}

function BandPicker({
  label,
  bands,
  value,
  onChange,
}: {
  label: string;
  bands: BandOption[];
  value?: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-3">
      <p className="mb-2 text-[13px] text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {bands.map((b) => {
          const on = b.id === value;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onChange(b.id)}
              aria-pressed={on}
              className={`flex h-10 items-center gap-2 rounded-full px-4 text-[14px] transition-colors duration-200 ${
                on ? "text-white" : "bg-surface hover:bg-line"
              }`}
              style={on ? { background: bandColor(b.id) } : undefined}
            >
              {!on && <span className="size-2 rounded-full" style={{ background: bandColor(b.id) }} />}
              {b.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OptionMark({ mode, on }: { mode: Mode; on: boolean }) {
  const ink = on ? "var(--bg)" : "var(--fg)";
  if (mode === "free")
    return <span className="size-3 rounded-full border-[1.5px]" style={{ borderColor: ink }} />;
  if (mode === "maybe")
    return <span className="size-3 rounded-full border-[1.5px] border-dashed" style={{ borderColor: ink }} />;
  if (mode === "busy")
    return <span className="size-3 rounded-full" style={{ background: on ? "var(--bg)" : "var(--faint)" }} />;
  return <span className="text-[13px] leading-3">♪</span>;
}

function NoteAndSave({
  note,
  setNote,
  placeholder,
}: {
  note: string;
  setNote: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        name="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={placeholder}
        maxLength={140}
        className={`${input} flex-1`}
      />
      <button
        type="submit"
        className="h-[50px] shrink-0 rounded-2xl bg-fg px-5 text-[15px] font-medium text-bg transition-opacity duration-200 hover:opacity-85"
      >
        Save
      </button>
    </div>
  );
}

function SaveButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-[52px] w-full rounded-full bg-fg text-[15px] font-medium text-bg transition-opacity duration-200 hover:opacity-85"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

const Section = ({ children }: { children: ReactNode }) => <div className="mt-5">{children}</div>;

function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block px-1 text-[12px] text-muted">{text}</span>
      {children}
    </label>
  );
}

const input =
  "h-[50px] w-full rounded-2xl bg-surface px-4 outline-none placeholder:text-faint focus:ring-2 focus:ring-fg/15";
const inputOnSurface =
  "min-h-[46px] w-full rounded-xl bg-bg px-3.5 py-2.5 outline-none placeholder:text-faint focus:ring-2 focus:ring-fg/15";
