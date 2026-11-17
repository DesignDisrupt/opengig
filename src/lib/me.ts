/**
 * Who is using the app. There are no accounts: you pick your name once and a
 * cookie remembers it on that device. It is a convenience, not security —
 * the band link is the only key — but every page and action goes through it,
 * so the app always knows whose calendar it is showing and who made a change.
 */
import { PEOPLE } from "./seed";
import type { Person } from "./types";

export const ME_COOKIE = "gig_me";

/** A year. Re-picking your name refreshes it. */
export const ME_MAX_AGE = 60 * 60 * 24 * 365;

export const findMe = (id: string | undefined): Person | undefined =>
  id ? PEOPLE.find((p) => p.id === id) : undefined;

export const isManager = (p: Person | undefined) => p?.role === "manager";

/** Booking Dates and gig editing are for the people who book: Adam and Brady. */
export const canBook = (p: Person | undefined) => isManager(p) || !!p?.books;

/** Where you land after picking your name: your calendar, or the booking view for the manager. */
export const landingFor = (p: Person) => (isManager(p) ? "/dates" : `/m/${p.id}`);
