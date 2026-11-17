import type { Calendar } from "./availability";
import { timeRange } from "./dates";
import { PEOPLE } from "./seed";
import type { Band, Gig, PersonDay } from "./types";

/** Each band's colour token, in globals.css. */
const BAND_COLOR: Record<string, string> = {
  "whiskey-mountain-highway": "var(--band-wmh)",
  "jt-sheets-band": "var(--band-jt)",
  loveyoubye: "var(--band-lyb)",
};
export const bandColor = (bandId: string) => BAND_COLOR[bandId] ?? "var(--muted)";

/** Short names for tight spots like the band switcher. */
const BAND_SHORT: Record<string, string> = {
  "whiskey-mountain-highway": "WMH",
  "jt-sheets-band": "JT Sheets",
  loveyoubye: "Loveyoubye",
};
export const bandShort = (bandId: string) => BAND_SHORT[bandId] ?? bandId;

export const personName = (id: string) => PEOPLE.find((p) => p.id === id)?.name ?? id;
export const findPerson = (id: string) => PEOPLE.find((p) => p.id === id);

export function bandOf(cal: Calendar, bandId: string): Band | undefined {
  return cal.bands.find((b) => b.id === bandId);
}
export function bandsFor(cal: Calendar, personId: string): Band[] {
  return cal.bands.filter((b) => b.memberIds.includes(personId));
}

/** One line describing a person's day, e.g. "Gig with Loveyoubye" or "Busy — wedding". */
export function describe(cal: Calendar, day: PersonDay): string {
  if (day.status === "busy" && day.reason === "gig") {
    const names = day.gigs.map((g) => bandOf(cal, g.bandId)?.name ?? g.bandId);
    return `Gig with ${names.join(" + ")}`;
  }
  const label = { free: "Free", maybe: "Maybe", busy: "Busy" }[day.status];
  return day.reason === "self" && day.note ? `${label} — ${day.note}` : label;
}

/** "8:00 PM – 12:00 AM · The Roadhouse", or "Details to come" for a bare hold. */
export function gigSummary(gig: Gig): string {
  const parts = [timeRange(gig.startTime, gig.endTime), gig.venue].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Details to come";
}
