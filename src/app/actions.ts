"use server";

/**
 * Everything the UI can change. There are no accounts — the band link is the
 * key — but every change is made as whoever picked their name on this device
 * (the `gig_me` cookie), and a member can only change their own days.
 */
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findMe, gigBandsFor, isManager, landingFor, ME_COOKIE, ME_MAX_AGE } from "@/lib/me";
import { CLOCK, eachDayOf, ISO_DATE } from "@/lib/dates";
import { BANDS, PEOPLE } from "@/lib/seed";
import { addGig, deleteGig, getCalendar, saveGig, saveMark } from "@/lib/store";

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
/** Whoever picked their name on this device. Every change needs one. */
async function me() {
  const p = findMe((await cookies()).get(ME_COOKIE)?.value);
  if (!p) throw new Error("Pick your name first");
  return p;
}

/** Whoever is picked, if they may add or change gigs for this band (see gigBandsFor). */
async function gigEditor(bandId: string) {
  const p = await me();
  const cal = await getCalendar();
  if (!gigBandsFor(p, cal.bands).includes(bandId)) {
    const name = BANDS.find((b) => b.id === bandId)?.name ?? "that band";
    throw new Error(`You can’t add or change ${name} gigs`);
  }
  return p;
}

/** The same check, starting from a gig's id. */
async function gigEditorFor(gigId: string) {
  const gig = (await getCalendar()).gigs.find((g) => g.id === gigId);
  if (!gig) throw new Error("That gig no longer exists");
  return gigEditor(gig.bandId);
}

/** The person a form is acting for — which must be the person using the app. */
async function person(form: FormData) {
  const v = str(form, "personId");
  if (!PEOPLE.some((p) => p.id === v)) throw new Error(`Unknown person: ${v}`);
  if (v !== (await me()).id) throw new Error("You can only change your own calendar");
  return v;
}

/** The name picker. Remembers the choice and goes to that person's landing page. */
export async function chooseMe(form: FormData) {
  const p = findMe(str(form, "personId"));
  if (!p) throw new Error("Unknown person");
  (await cookies()).set(ME_COOKIE, p.id, {
    maxAge: ME_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect(landingFor(p));
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
    const personId = await person(form);
    const start = date(form);
    const mode = str(form, "mode");

    if (mode === "gig") {
      const bandId = band(form);
      await gigEditor(bandId);
      await addGig(bandId, start, gigDetails(form), personId);
      revalidatePath("/", "layout");
      const name = BANDS.find((b) => b.id === bandId)?.name;
      return { ok: true, message: `Gig added for ${name}` };
    }

    if (mode !== "free" && mode !== "maybe" && mode !== "busy") throw new Error(`Bad choice: ${mode}`);
    if (isManager(findMe(personId)))
      throw new Error("The manager books gigs but has no availability to mark");
    const end = optional(form, "endDate") ?? start;
    if (!ISO_DATE.test(end)) throw new Error("Pick an end date");
    if (end < start) throw new Error("The end date is before the start date");
    const days = eachDayOf(start, end);
    if (days.length > MAX_RANGE_DAYS) throw new Error(`That's more than ${MAX_RANGE_DAYS} days`);

    // Only Maybe carries a note; a busy day is just busy (Adam, 2026-11-17).
    const note = mode === "maybe" ? optional(form, "note") : undefined;
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
    await gigEditorFor(str(form, "id"));
    await deleteGig(str(form, "id"));
    revalidatePath("/", "layout");
    return { ok: true, message: "Gig cancelled" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function updateGigDetails(form: FormData) {
  const id = str(form, "id");
  await gigEditorFor(id);
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
  await gigEditorFor(id);
  const back = str(form, "back");
  await deleteGig(id);
  revalidatePath("/", "layout");
  // Only same-site paths; "//host" would leave the site.
  redirect(/^\/(?!\/)/.test(back) ? back : "/");
}
