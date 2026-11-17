"use server";

/**
 * Everything the UI can change. There are no accounts — the band link is the
 * key — so these validate their input but do not check who is calling.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CLOCK, eachDayOf, ISO_DATE } from "@/lib/dates";
import { BANDS, PEOPLE } from "@/lib/seed";
import { addGig, deleteGig, saveGig, saveMark } from "@/lib/store";

const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
};
const optional = (form: FormData, key: string) => str(form, key) || undefined;

function date(form: FormData, key = "date") {
  const v = str(form, key);
  if (!ISO_DATE.test(v)) throw new Error(`Bad date: ${v}`);
  return v;
}
function person(form: FormData) {
  const v = str(form, "personId");
  if (!PEOPLE.some((p) => p.id === v)) throw new Error(`Unknown person: ${v}`);
  return v;
}
function band(form: FormData, key = "bandId") {
  const v = str(form, key);
  if (!BANDS.some((b) => b.id === v)) throw new Error(`Unknown band: ${v}`);
  return v;
}
function clock(form: FormData, key: string) {
  const v = optional(form, key);
  if (v && !CLOCK.test(v)) throw new Error(`Bad time: ${v}`);
  return v;
}

export type QuickResult = { ok: true; message: string } | { ok: false; error: string };

/** Longest stretch "Block dates" will mark in one go — a tour, not a typo'd year. */
const MAX_RANGE_DAYS = 62;

function gigDetails(form: FormData) {
  const url = optional(form, "url");
  if (url && !/^https?:\/\//i.test(url)) throw new Error("Links must start with http:// or https://");
  return {
    startTime: clock(form, "startTime"),
    endTime: clock(form, "endTime"),
    venue: optional(form, "venue"),
    address: optional(form, "address"),
    url,
    note: optional(form, "gigNote"),
  };
}

/**
 * The day panel and the two quick actions all post here.
 *
 * mode free | maybe | busy — the member's own mark, for one day or a range
 *                            (`endDate`), with an optional reason in `note`.
 * mode gig                 — a gig for `bandId` on `date`, details optional.
 *                            Every member of that band is busy that day.
 */
export async function quickDay(form: FormData): Promise<QuickResult> {
  try {
    const personId = person(form);
    const start = date(form);
    const mode = str(form, "mode");

    if (mode === "gig") {
      const bandId = band(form);
      await addGig(bandId, start, gigDetails(form), personId);
      revalidatePath("/", "layout");
      const name = BANDS.find((b) => b.id === bandId)?.name;
      return { ok: true, message: `Gig added for ${name}` };
    }

    if (mode !== "free" && mode !== "maybe" && mode !== "busy") throw new Error(`Bad choice: ${mode}`);
    const end = optional(form, "endDate") ?? start;
    if (!ISO_DATE.test(end)) throw new Error("Pick an end date");
    if (end < start) throw new Error("The end date is before the start date");
    const days = eachDayOf(start, end);
    if (days.length > MAX_RANGE_DAYS) throw new Error(`That's more than ${MAX_RANGE_DAYS} days`);

    const note = mode === "free" ? undefined : optional(form, "note");
    for (const d of days) await saveMark(personId, d, mode, note);
    revalidatePath("/", "layout");

    const what = { free: "Free", maybe: "Maybe", busy: "Blocked" }[mode];
    return { ok: true, message: days.length > 1 ? `${what} · ${days.length} days` : `${what}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

/** Cancel a gig from the day panel without leaving the calendar. */
export async function removeGig(form: FormData): Promise<QuickResult> {
  try {
    await deleteGig(str(form, "id"));
    revalidatePath("/", "layout");
    return { ok: true, message: "Gig cancelled" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

/** Book a band on a date from the "dates that work" view. */
export async function bookDate(form: FormData) {
  const gig = await addGig(band(form), date(form));
  revalidatePath("/", "layout");
  redirect(`/gigs/${gig.id}?new=1`);
}

export async function updateGigDetails(form: FormData) {
  const id = str(form, "id");
  const url = optional(form, "url");
  if (url && !/^https?:\/\//i.test(url)) throw new Error("Links must start with http:// or https://");
  await saveGig(id, {
    date: date(form),
    startTime: clock(form, "startTime"),
    endTime: clock(form, "endTime"),
    venue: optional(form, "venue"),
    address: optional(form, "address"),
    url,
    note: optional(form, "note"),
  });
  revalidatePath("/", "layout");
  redirect(`/gigs/${id}`);
}

export async function cancelGig(form: FormData) {
  const id = str(form, "id");
  const back = str(form, "back");
  await deleteGig(id);
  revalidatePath("/", "layout");
  // Only same-site paths; "//host" would leave the site.
  redirect(/^\/(?!\/)/.test(back) ? back : "/");
}
