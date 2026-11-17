import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { saveDay } from "@/app/actions";
import { BackLink, BandDot, Field, Page, Skeleton, Title, inputClass, primaryButton } from "@/components/ui";
import { personDay } from "@/lib/availability";
import { ISO_DATE, shortDate } from "@/lib/dates";
import { getCalendar } from "@/lib/store";
import { bandColor, bandOf, bandsFor, findPerson, gigSummary } from "@/lib/view";

export default function DayPage(props: PageProps<"/m/[personId]/[date]">) {
  return (
    <Page>
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
        <DayEditor {...props} />
      </Suspense>
    </Page>
  );
}

const STATUSES = [
  { value: "free", label: "Free" },
  { value: "maybe", label: "Maybe" },
  { value: "busy", label: "Busy" },
] as const;

async function DayEditor({ params }: PageProps<"/m/[personId]/[date]">) {
  const { personId, date } = await params;
  const person = findPerson(personId);
  if (!person || !ISO_DATE.test(date)) notFound();

  const cal = await getCalendar();
  const day = personDay(cal, personId, date);
  const bands = bandsFor(cal, personId);
  const gigs = day.status === "busy" && day.reason === "gig" ? day.gigs : [];
  const own = cal.marks.find((m) => m.personId === personId && m.date === date);

  // A gig day opens on Busy with that band picked.
  const status = gigs.length ? "busy" : (own?.status ?? "free");
  const reason = gigs.find((g) => bands.some((b) => b.id === g.bandId))?.bandId ?? "other";
  const year = date.slice(0, 4);

  return (
    <>
      <BackLink href={`/m/${personId}?month=${date.slice(0, 7)}`} label={`Back to ${person.name}’s calendar`} />
      <Title sub={`${person.name} · ${year}`}>{shortDate(date)}</Title>

      {gigs.length > 0 && (
        <div className="mb-8 space-y-2">
          {gigs.map((g) => (
            <Link
              key={g.id}
              href={`/gigs/${g.id}`}
              className="flex items-center gap-3 rounded-2xl bg-surface py-3.5 pr-4 pl-3 transition-colors duration-200 hover:bg-line"
            >
              <span className="h-9 w-1 rounded-full" style={{ background: bandColor(g.bandId) }} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">Gig with {bandOf(cal, g.bandId)?.name}</p>
                <p className="truncate text-[13px] text-muted">{gigSummary(g)}</p>
              </div>
              <span aria-hidden className="text-faint">›</span>
            </Link>
          ))}
          <p className="px-1 pt-1 text-[13px] text-muted">
            {gigs.length > 1 ? "You’re double-booked. " : ""}A gig keeps the day busy. To free it, open
            the gig and cancel it.
          </p>
        </div>
      )}

      <form action={saveDay} className="day-form">
        <input type="hidden" name="personId" value={personId} />
        <input type="hidden" name="date" value={date} />

        <fieldset>
          <legend className="sr-only">This day I’m</legend>
          <div className="flex rounded-full bg-surface p-1">
            {STATUSES.map((s) => (
              <label key={s.value} className="flex-1">
                <input
                  type="radio"
                  name="status"
                  value={s.value}
                  defaultChecked={status === s.value}
                  className="peer sr-only"
                />
                <span className="flex h-11 items-center justify-center rounded-full text-[15px] text-muted transition-all duration-200 peer-checked:bg-bg peer-checked:font-medium peer-checked:text-fg peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-fg/30">
                  {s.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="busy-only mt-8">
          <legend className="mb-2 px-1 text-[13px] text-muted">Busy because</legend>
          <div className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
            {bands.map((b) => (
              <Reason
                key={b.id}
                value={b.id}
                checked={reason === b.id}
                band
                hint="Marks the whole band busy"
              >
                <BandDot bandId={b.id} className="size-2.5" /> Gig with {b.name}
              </Reason>
            ))}
            <Reason value="other" checked={reason === "other"}>
              <span className="size-2.5 rounded-full bg-faint" aria-hidden /> Something else
            </Reason>
          </div>
        </fieldset>

        <div className="note-field mt-8">
          <Field label="Note">
            <input
              name="note"
              defaultValue={own?.note ?? ""}
              placeholder="Optional — e.g. free after 7pm"
              className={inputClass}
              maxLength={140}
            />
          </Field>
        </div>

        <div className="sticky bottom-0 -mx-5 mt-10 bg-gradient-to-t from-bg from-60% to-transparent px-5 pt-6 pb-5">
          <button type="submit" className={primaryButton}>
            Save
          </button>
        </div>
      </form>
    </>
  );
}

/** One row of the reason list, with an iOS-style check on the right. */
function Reason({
  value,
  checked,
  band = false,
  hint,
  children,
}: {
  value: string;
  checked: boolean;
  band?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 px-4 py-3.5">
      <input
        type="radio"
        name="reason"
        value={value}
        defaultChecked={checked}
        data-band={band ? "" : undefined}
        className="peer sr-only"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2.5 text-[15px]">{children}</span>
        {hint && <span className="mt-0.5 block pl-5 text-[13px] text-muted">{hint}</span>}
      </span>
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] border-faint text-[13px] text-transparent transition-colors duration-200 peer-checked:border-fg peer-checked:bg-fg peer-checked:text-bg peer-focus-visible:ring-2 peer-focus-visible:ring-fg/30"
      >
        ✓
      </span>
    </label>
  );
}
