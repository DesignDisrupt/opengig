import type {
  Band,
  BandDay,
  BandId,
  BusyReason,
  DayVerdict,
  Gig,
  ISODate,
  Mark,
  MarkStatus,
  PersonDay,
  PersonId,
} from "./types";

export interface Calendar {
  bands: Band[];
  gigs: Gig[];
  marks: Mark[];
}

/** Every date from `start` to `end`, inclusive. */
export function eachDay(start: ISODate, end: ISODate): ISODate[] {
  const days: ISODate[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (d <= last) {
    days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

/** The gigs on `date` for any band `personId` is on. */
export function gigsFor(cal: Calendar, personId: PersonId, date: ISODate): Gig[] {
  const theirBands = new Set(
    cal.bands.filter((b) => b.memberIds.includes(personId)).map((b) => b.id),
  );
  return cal.gigs.filter((g) => g.date === date && theirBands.has(g.bandId));
}

/** A person's day: a band gig wins over their own mark. */
export function personDay(cal: Calendar, personId: PersonId, date: ISODate): PersonDay {
  const gigs = gigsFor(cal, personId, date);
  if (gigs.length > 0) return { personId, status: "busy", reason: "gig", gigs };

  const mark = cal.marks.find((m) => m.personId === personId && m.date === date);
  if (mark) return { personId, status: mark.status, reason: "self", note: mark.note };

  return { personId, status: "free", reason: "default" };
}

function verdict(members: PersonDay[]): DayVerdict {
  if (members.some((m) => m.status === "busy")) return "conflict";
  if (members.some((m) => m.status === "maybe")) return "maybe";
  return "works";
}

/** How `date` looks for booking `bandId`, with every member's reason. */
export function bandDay(cal: Calendar, bandId: BandId, date: ISODate): BandDay {
  const band = cal.bands.find((b) => b.id === bandId);
  if (!band) throw new Error(`Unknown band: ${bandId}`);
  const members = band.memberIds.map((id) => personDay(cal, id, date));
  return { date, bandId, verdict: verdict(members), members };
}

/** The "dates that work" view: every day in the range, judged for one band. */
export function bandRange(
  cal: Calendar,
  bandId: BandId,
  start: ISODate,
  end: ISODate,
): BandDay[] {
  return eachDay(start, end).map((date) => bandDay(cal, bandId, date));
}

/* ---- Changes. Each returns a new Calendar; nothing is mutated. ---- */

/** Set a member's own mark for a day, replacing any earlier one. */
export function setMark(
  cal: Calendar,
  personId: PersonId,
  date: ISODate,
  status: MarkStatus,
  note?: string,
): Calendar {
  const rest = cal.marks.filter((m) => !(m.personId === personId && m.date === date));
  return { ...cal, marks: [...rest, { personId, date, status, note }] };
}

/** The band's gig on a day, if there is one. */
export function gigOn(cal: Calendar, bandId: BandId, date: ISODate): Gig | undefined {
  return cal.gigs.find((g) => g.bandId === bandId && g.date === date);
}

/**
 * A member marks a day busy.
 *
 * - `other`: a busy mark on their own day only, with an optional note.
 * - `band`:  a gig hold for that band on that day, which makes every member
 *   of the band busy. If the band already has a gig that day it is reused,
 *   so two members picking the same band do not create two gigs. A member
 *   can only pick a band they are on.
 */
export function markBusy(
  cal: Calendar,
  personId: PersonId,
  date: ISODate,
  reason: BusyReason,
  newId: () => string = () => crypto.randomUUID(),
): { cal: Calendar; gig?: Gig } {
  if (reason.kind === "other") {
    return { cal: setMark(cal, personId, date, "busy", reason.note) };
  }

  const band = cal.bands.find((b) => b.id === reason.bandId);
  if (!band) throw new Error(`Unknown band: ${reason.bandId}`);
  if (!band.memberIds.includes(personId)) {
    throw new Error(`${personId} is not on ${band.name}`);
  }

  const existing = gigOn(cal, band.id, date);
  if (existing) return { cal, gig: existing };

  const gig: Gig = { id: newId(), bandId: band.id, date, createdBy: personId };
  return { cal: { ...cal, gigs: [...cal.gigs, gig] }, gig };
}

export type GigDetails = Partial<Omit<Gig, "id" | "bandId" | "createdBy">>;

/** Fill in a gig's details later — times, venue, address, link, note — or move its date. */
export function updateGig(cal: Calendar, gigId: string, changes: GigDetails): Calendar {
  return { ...cal, gigs: cal.gigs.map((g) => (g.id === gigId ? { ...g, ...changes } : g)) };
}

/** Cancel a gig; its members' days fall back to their own marks. */
export function removeGig(cal: Calendar, gigId: string): Calendar {
  return { ...cal, gigs: cal.gigs.filter((g) => g.id !== gigId) };
}
