/**
 * Where the calendar lives. Server-only.
 *
 * With DATABASE_URL set, everything reads and writes Neon. Without it, the app
 * runs on an in-memory copy of the seed so the UI can be built and tried
 * before the database exists — changes there vanish when the server restarts.
 */
import { and, eq } from "drizzle-orm";
import { connection } from "next/server";
import {
  type Calendar,
  type GigDetails,
  markBusy as markBusyPure,
  removeGig as removeGigPure,
  setMark as setMarkPure,
  updateGig as updateGigPure,
} from "./availability";
import { BANDS, GIGS, MARKS } from "./seed";
import type { BusyReason, Gig, ISODate, MarkStatus, PersonId } from "./types";

export const usingDatabase = Boolean(process.env.DATABASE_URL);

/* ---------- In-memory fallback ---------- */

const g = globalThis as unknown as { __bandCalendar?: Calendar };
const memory = () =>
  (g.__bandCalendar ??= { bands: BANDS, gigs: [...GIGS], marks: [...MARKS] });
const commit = (cal: Calendar) => {
  g.__bandCalendar = cal;
};

/* ---------- Neon ---------- */

const database = async () => (await import("@/db")).db;
const schema = async () => (await import("@/db")).schema;

/** Postgres `time` comes back as `20:00:00`; the app works in `HH:MM`. */
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : undefined);
const opt = <T,>(v: T | null) => v ?? undefined;

/* ---------- Reads ---------- */

/** The whole calendar. A band's year of gigs and marks is small enough to load at once. */
export async function getCalendar(): Promise<Calendar> {
  await connection(); // always fresh, never baked into the build
  if (!usingDatabase) return memory();

  const db = await database();
  // Names come from PEOPLE in seed.ts; the database holds who is on which band.
  const [bandRows, members, gigRows, markRows] = await Promise.all([
    db.query.bands.findMany(),
    db.query.bandMembers.findMany(),
    db.query.gigs.findMany(),
    db.query.marks.findMany(),
  ]);

  // Keep the seed's band order, which puts WMH first.
  const order = (id: string) => {
    const i = BANDS.findIndex((b) => b.id === id);
    return i < 0 ? BANDS.length : i;
  };
  return {
    bands: bandRows
      .sort((a, b) => order(a.id) - order(b.id))
      .map((b) => ({
        id: b.id,
        name: b.name,
        memberIds: members.filter((m) => m.bandId === b.id).map((m) => m.personId),
      })),
    gigs: gigRows.map((r) => ({
      id: r.id,
      bandId: r.bandId,
      date: r.date,
      startTime: hhmm(r.startTime),
      endTime: hhmm(r.endTime),
      venue: opt(r.venue),
      address: opt(r.address),
      url: opt(r.url),
      note: opt(r.note),
      createdBy: opt(r.createdBy),
    })),
    marks: markRows.map((r) => ({
      personId: r.personId,
      date: r.date,
      status: r.status,
      note: opt(r.note),
    })),
  };
}

/* ---------- Writes ---------- */

/** Set a member's own mark. Free deletes the mark, since no mark means free. */
export async function saveMark(
  personId: PersonId,
  date: ISODate,
  status: MarkStatus,
  note?: string,
): Promise<void> {
  if (!usingDatabase) {
    const cal = memory();
    commit(
      status === "free" && !note
        ? { ...cal, marks: cal.marks.filter((m) => !(m.personId === personId && m.date === date)) }
        : setMarkPure(cal, personId, date, status, note),
    );
    return;
  }
  const db = await database();
  const { marks } = await schema();
  const where = and(eq(marks.personId, personId), eq(marks.date, date));
  if (status === "free" && !note) {
    await db.delete(marks).where(where);
    return;
  }
  await db
    .insert(marks)
    .values({ personId, date, status, note: note ?? null })
    .onConflictDoUpdate({ target: [marks.personId, marks.date], set: { status, note: note ?? null } });
}

/**
 * A member marks a day busy. For a band, this creates (or reuses) the band's
 * gig hold and clears the member's own mark, so cancelling the gig later
 * leaves the day free rather than reviving an older mark.
 */
export async function saveBusy(
  personId: PersonId,
  date: ISODate,
  reason: BusyReason,
): Promise<Gig | undefined> {
  if (reason.kind === "other") {
    await saveMark(personId, date, "busy", reason.note);
    return undefined;
  }
  // Validation (band exists, person is on it) lives in the pure function.
  const current = await getCalendar();
  const { gig } = markBusyPure(current, personId, date, reason);
  await saveMark(personId, date, "free");

  if (!usingDatabase) {
    const cal = memory();
    if (gig && !cal.gigs.some((x) => x.id === gig.id)) commit({ ...cal, gigs: [...cal.gigs, gig] });
    return gig;
  }
  if (gig && !current.gigs.some((x) => x.id === gig.id)) {
    const db = await database();
    const { gigs } = await schema();
    await db.insert(gigs).values({ id: gig.id, bandId: gig.bandId, date, createdBy: personId });
  }
  return gig;
}

/** Add a gig for a band — from "Book", "Add gig" or a day's Gig option. */
export async function addGig(
  bandId: string,
  date: ISODate,
  details: Omit<GigDetails, "date"> = {},
  createdBy?: PersonId,
): Promise<Gig> {
  const gig: Gig = { id: crypto.randomUUID(), bandId, date, ...details, createdBy };
  if (!usingDatabase) {
    const cal = memory();
    if (!cal.bands.some((b) => b.id === bandId)) throw new Error(`Unknown band: ${bandId}`);
    commit({ ...cal, gigs: [...cal.gigs, gig] });
    return gig;
  }
  const db = await database();
  const { gigs } = await schema();
  await db.insert(gigs).values({
    id: gig.id,
    bandId,
    date,
    startTime: gig.startTime ?? null,
    endTime: gig.endTime ?? null,
    venue: gig.venue ?? null,
    address: gig.address ?? null,
    url: gig.url ?? null,
    note: gig.note ?? null,
    createdBy: createdBy ?? null,
  });
  return gig;
}

export async function saveGig(gigId: string, details: GigDetails): Promise<void> {
  if (!usingDatabase) {
    commit(updateGigPure(memory(), gigId, details));
    return;
  }
  const db = await database();
  const { gigs } = await schema();
  const blank = (v?: string) => v ?? null;
  await db
    .update(gigs)
    .set({
      date: details.date,
      startTime: blank(details.startTime),
      endTime: blank(details.endTime),
      venue: blank(details.venue),
      address: blank(details.address),
      url: blank(details.url),
      note: blank(details.note),
    })
    .where(eq(gigs.id, gigId));
}

export async function deleteGig(gigId: string): Promise<void> {
  if (!usingDatabase) {
    commit(removeGigPure(memory(), gigId));
    return;
  }
  const db = await database();
  const { gigs } = await schema();
  await db.delete(gigs).where(eq(gigs.id, gigId));
}
