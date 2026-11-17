import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cancelGig, updateGigDetails } from "@/app/actions";
import { BackLink, BandDot, Field, Page, Skeleton, Title, inputClass, primaryButton } from "@/components/ui";
import { shortDate } from "@/lib/dates";
import { getCalendar } from "@/lib/store";
import { bandOf, personName } from "@/lib/view";

export default function GigPage(props: PageProps<"/gigs/[id]">) {
  return (
    <Page>
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
        <GigEditor {...props} />
      </Suspense>
    </Page>
  );
}

async function GigEditor({ params, searchParams }: PageProps<"/gigs/[id]">) {
  const { id } = await params;
  const q = await searchParams;
  const cal = await getCalendar();
  const gig = cal.gigs.find((g) => g.id === id);
  if (!gig) notFound();

  const band = bandOf(cal, gig.bandId);
  const members = band?.memberIds.map(personName) ?? [];
  const back = `/dates?band=${gig.bandId}&month=${gig.date.slice(0, 7)}`;

  return (
    <>
      <BackLink href={back} label="Back to dates that work" />
      <Title
        sub={
          <span className="flex items-center gap-2">
            <BandDot bandId={gig.bandId} className="size-2.5" />
            {band?.name} · {gig.date.slice(0, 4)}
          </span>
        }
      >
        {shortDate(gig.date)}
      </Title>

      {q.new === "1" && (
        <p className="-mt-3 mb-6 rounded-2xl bg-ok-tint px-4 py-3 text-[14px] text-ok">
          Booked. Add details now or later — only the date is needed.
        </p>
      )}

      <p className="mb-8 text-[14px] text-muted">
        Keeps {members.join(", ")} busy that day.
        {gig.createdBy ? ` Held by ${personName(gig.createdBy)}.` : ""}
      </p>

      <form action={updateGigDetails} className="space-y-5">
        <input type="hidden" name="id" value={gig.id} />
        <Field label="Date">
          <input type="date" name="date" required defaultValue={gig.date} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts">
            <input type="time" name="startTime" defaultValue={gig.startTime ?? ""} className={inputClass} />
          </Field>
          <Field label="Ends">
            <input type="time" name="endTime" defaultValue={gig.endTime ?? ""} className={inputClass} />
          </Field>
        </div>
        <Field label="Venue">
          <input name="venue" defaultValue={gig.venue ?? ""} placeholder="The Roadhouse" className={inputClass} />
        </Field>
        <Field label="Address">
          <input
            name="address"
            defaultValue={gig.address ?? ""}
            placeholder="Street, city"
            className={inputClass}
          />
        </Field>
        {gig.address && (
          <a
            href={`https://maps.apple.com/?q=${encodeURIComponent(gig.address)}`}
            target="_blank"
            rel="noreferrer"
            className="-mt-3 block px-1 text-[13px] text-muted underline decoration-faint underline-offset-2 hover:text-fg"
          >
            Open in Maps
          </a>
        )}
        <Field label="Link">
          <input type="url" name="url" defaultValue={gig.url ?? ""} placeholder="https://" className={inputClass} />
        </Field>
        <Field label="Notes">
          <textarea name="note" defaultValue={gig.note ?? ""} rows={3} placeholder="Load-in, set length, pay…" className={`${inputClass} resize-none`} />
        </Field>

        <div className="sticky bottom-0 -mx-5 bg-gradient-to-t from-bg from-60% to-transparent px-5 pt-6 pb-5">
          <button type="submit" className={primaryButton}>
            Save
          </button>
        </div>
      </form>

      <form action={cancelGig} className="mt-2 text-center">
        <input type="hidden" name="id" value={gig.id} />
        <input type="hidden" name="back" value={back} />
        <button
          type="submit"
          className="h-11 rounded-full px-5 text-[15px] font-medium text-danger transition-opacity duration-200 hover:opacity-75"
        >
          Cancel this gig
        </button>
        <p className="text-[13px] text-muted">Frees the day for everyone in {band?.name}.</p>
      </form>
    </>
  );
}
