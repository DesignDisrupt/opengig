"use server";

/**
 * Everything the UI can change. There are no accounts — the band link is the
 * key — so these validate their input but do not check who is calling.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CLOCK, ISO_DATE } from "@/lib/dates";
import { BANDS, PEOPLE } from "@/lib/seed";
import { addGig, deleteGig, saveBusy, saveGig, saveMark } from "@/lib/store";

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

/** A member's day editor: Free / Maybe / Busy (Other or one of their bands). */
export async function saveDay(form: FormData) {
  const personId = person(form);
  const day = date(form);
  const status = str(form, "status");
  const note = optional(form, "note");

  if (status === "free" || status === "maybe") {
    await saveMark(personId, day, status, note);
  } else if (status === "busy") {
    const reason = str(form, "reason");
    if (reason === "other") {
      await saveBusy(personId, day, { kind: "other", note });
    } else {
      await saveBusy(personId, day, { kind: "band", bandId: band(form, "reason") });
    }
  } else {
    throw new Error(`Bad status: ${status}`);
  }

  revalidatePath("/", "layout");
  redirect(`/m/${personId}?month=${day.slice(0, 7)}`);
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
