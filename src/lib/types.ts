/** A calendar day as `YYYY-MM-DD`. Plain strings, so no timezone can shift a gig. */
export type ISODate = string;

export type PersonId = string;
export type BandId = string;

export interface Person {
  id: PersonId;
  name: string;
}

export interface Band {
  id: BandId;
  name: string;
  /** A person can be on several bands' rosters. */
  memberIds: PersonId[];
}

/** A time of day as 24-hour `HH:MM`. */
export type ClockTime = string;

/**
 * A band's gig on a day. It starts as a bare hold — someone marked the day
 * busy for this band — and every detail below the date is optional, filled in
 * later. Every member of the band is busy that day because the gig exists.
 *
 * The fields follow what whiskeymountainhighway.com lists for a show.
 */
export interface Gig {
  id: string;
  bandId: BandId;
  date: ISODate;
  startTime?: ClockTime;
  /** Earlier than `startTime` means it runs past midnight ("20:00"–"00:00"). */
  endTime?: ClockTime;
  /** e.g. "The Roadhouse" */
  venue?: string;
  /** e.g. "6900 E Cave Creek Rd, Cave Creek, AZ 85331" */
  address?: string;
  /** The venue's or event's page. */
  url?: string;
  note?: string;
  /** Who put the hold on, when it came from a member's busy pick. */
  createdBy?: PersonId;
}

/** What a member marked for themselves. A day with no mark is free. */
export type MarkStatus = "free" | "maybe" | "busy";

/**
 * A member's own mark. A busy mark here is always the "Other" reason; busy
 * for a band is a Gig, not a mark, so it reaches the whole band.
 */
export interface Mark {
  personId: PersonId;
  date: ISODate;
  status: MarkStatus;
  note?: string;
}

/** The reason a member picks when marking a day busy. */
export type BusyReason = { kind: "other"; note?: string } | { kind: "band"; bandId: BandId };

/**
 * A person's resolved day. A gig for any band they are on overrides their own
 * mark, so gig-busy is derived from the gig and follows it if it moves.
 */
export type PersonDay =
  /** More than one gig means the person is double-booked across bands. */
  | { personId: PersonId; status: "busy"; reason: "gig"; gigs: Gig[] }
  | { personId: PersonId; status: MarkStatus; reason: "self"; note?: string }
  /** Nothing marked and no gig: free by default. */
  | { personId: PersonId; status: "free"; reason: "default" };

/** How a day looks for booking one band. */
export type DayVerdict =
  /** Every member is free and nobody has a gig. */
  | "works"
  /** No conflicts, but at least one member said maybe. */
  | "maybe"
  /** At least one member is busy. */
  | "conflict";

export interface BandDay {
  date: ISODate;
  bandId: BandId;
  verdict: DayVerdict;
  /** Every member's resolved day, in roster order. */
  members: PersonDay[];
}
