/**
 * Plain, serialisable month data for the client calendars. The server works
 * out every day here, so the client only draws and never re-derives rules.
 */
import { bandDay, personDay, type Calendar } from "./availability";
import { monthGrid } from "./dates";
import type { DayVerdict, Gig, ISODate, MarkStatus } from "./types";
import { bandAbbr, bandOf, bandShort, describe, gigSummary, personName } from "./view";

export interface BandOption {
  id: string;
  name: string;
  short: string;
}

export interface GigChip {
  id: string;
  bandId: string;
  bandName: string;
  /** "WMH", "JT Sheets" — for the band switcher. */
  bandShort: string;
  /** "WMH", "JT", "LYB" — for calendar cells. */
  bandAbbr: string;
  summary: string;
  startTime?: string;
}

export interface MemberDay {
  date: ISODate;
  /** The member's own mark, if any. A gig can sit on top of it. */
  mark?: { status: MarkStatus; note?: string };
  gigs: GigChip[];
}

export interface BandBoardDay {
  date: ISODate;
  verdict: DayVerdict;
  booked?: GigChip;
  /** Who is out and why, grouped: "Jacob, Brando, Cade" — "Gig with Loveyoubye". */
  out: { who: string; why: string; bandId?: string }[];
  maybe: boolean;
  /** Another band has a gig that day — the day reads as taken even if nobody overlaps. */
  otherBooked: boolean;
  /** Those bands, by id, for the panel to name. */
  otherBandIds: string[];
}

export const chip = (cal: Calendar, g: Gig): GigChip => ({
  id: g.id,
  bandId: g.bandId,
  bandName: bandOf(cal, g.bandId)?.name ?? g.bandId,
  bandShort: bandShort(g.bandId),
  bandAbbr: bandAbbr(g.bandId),
  summary: gigSummary(g),
  startTime: g.startTime,
});

/**
 * Weeks of the month for one person; null pads the grid. For the manager —
 * on no roster, with no availability of their own — every band's gigs show.
 */
export function memberMonth(
  cal: Calendar,
  personId: string,
  month: string,
  manager = false,
): (MemberDay | null)[][] {
  return monthGrid(month).map((week) =>
    week.map((date) => {
      if (!date) return null;
      if (manager) {
        return { date, gigs: cal.gigs.filter((g) => g.date === date).map((g) => chip(cal, g)) };
      }
      const day = personDay(cal, personId, date);
      const mark = cal.marks.find((m) => m.personId === personId && m.date === date);
      return {
        date,
        mark: mark ? { status: mark.status, note: mark.note } : undefined,
        gigs: day.status === "busy" && day.reason === "gig" ? day.gigs.map((g) => chip(cal, g)) : [],
      };
    }),
  );
}

/** Weeks of the month judged for booking one band. */
export function bandMonth(cal: Calendar, bandId: string, month: string): (BandBoardDay | null)[][] {
  return monthGrid(month).map((week) =>
    week.map((date) => {
      if (!date) return null;
      const d = bandDay(cal, bandId, date);
      const booked = cal.gigs.find((g) => g.bandId === bandId && g.date === date);
      const groups = new Map<string, { who: string[]; bandId?: string }>();
      for (const m of d.members) {
        if (m.status === "free") continue;
        // The band's own gig is "booked", not a reason anyone is out.
        if (booked && m.status === "busy" && m.reason === "gig" && m.gigs.every((g) => g.bandId === bandId)) {
          continue;
        }
        const why = describe(cal, m);
        const gigBand = m.status === "busy" && m.reason === "gig" ? m.gigs[0].bandId : undefined;
        const g = groups.get(why) ?? { who: [], bandId: gigBand };
        g.who.push(personName(m.personId));
        groups.set(why, g);
      }
      return {
        date,
        verdict: d.verdict,
        booked: booked ? chip(cal, booked) : undefined,
        out: [...groups].map(([why, g]) => ({ why, who: g.who.join(", "), bandId: g.bandId })),
        maybe: d.members.some((m) => m.status === "maybe"),
        otherBooked: cal.gigs.some((g) => g.date === date && g.bandId !== bandId),
        otherBandIds: [...new Set(cal.gigs.filter((g) => g.date === date && g.bandId !== bandId).map((g) => g.bandId))],
      };
    }),
  );
}
