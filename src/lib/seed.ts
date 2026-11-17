import type { Band, Gig, Mark, Person } from "./types";

/** Seven players across three bands, plus Adam, who manages and is on no roster. */
export const PEOPLE: Person[] = [
  { id: "brady", name: "Brady" },
  { id: "jacob", name: "Jacob" },
  { id: "mike", name: "Mike" },
  { id: "brando", name: "Brando" },
  { id: "cade", name: "Cade" },
  { id: "jt", name: "JT" },
  { id: "phil", name: "Phil" },
  { id: "adam", name: "Adam", role: "manager" },
];

export const BANDS: Band[] = [
  {
    id: "whiskey-mountain-highway",
    name: "Whiskey Mountain Highway",
    memberIds: ["brady", "jacob", "mike", "brando", "cade"],
  },
  {
    id: "jt-sheets-band",
    name: "JT Sheets Band",
    memberIds: ["jt", "jacob", "brando", "cade"],
  },
  {
    id: "loveyoubye",
    name: "Loveyoubye",
    memberIds: ["phil", "jacob", "brando", "jt", "cade"],
  },
];

/** The band the "dates that work" view opens on. */
export const DEFAULT_BAND_ID = "whiskey-mountain-highway";

const HORSE_AND_HYDE = {
  venue: "Horse & Hyde Arcadia",
  address: "3730 E Indian School Rd, Phoenix, AZ 85018",
  url: "https://horseandhyde.com/live-music/",
};
const ROADHOUSE = {
  venue: "The Roadhouse",
  address: "6900 E Cave Creek Rd, Cave Creek, AZ 85331",
  url: "https://hideaway-usa.com/",
};

/**
 * Whiskey Mountain Highway's shows as listed on whiskeymountainhighway.com,
 * read 2026-11-16. Ids are fixed so re-running the seed never duplicates them.
 * Horse & Hyde lists a start time only.
 */
const WMH_GIGS: Gig[] = [
  { date: "2026-11-25", startTime: "20:00", ...HORSE_AND_HYDE },
  { date: "2026-12-05", startTime: "20:00", ...HORSE_AND_HYDE },
  { date: "2026-12-18", startTime: "20:00", endTime: "00:00", ...ROADHOUSE },
  { date: "2027-01-29", startTime: "20:00", endTime: "00:00", ...ROADHOUSE },
  { date: "2027-03-12", startTime: "20:00", endTime: "00:00", ...ROADHOUSE },
  { date: "2027-04-30", startTime: "20:00", endTime: "00:00", ...ROADHOUSE },
  { date: "2027-10-08", startTime: "20:00", endTime: "00:00", ...ROADHOUSE },
  { date: "2027-11-12", startTime: "20:00", endTime: "00:00", ...ROADHOUSE },
  { date: "2027-12-10", startTime: "20:00", endTime: "00:00", ...ROADHOUSE },
].map((g) => ({ id: `wmh-${g.date}`, bandId: "whiskey-mountain-highway", ...g }));

/**
 * JT Sheets Band — only the FULL BAND listings from jtsheetsmusic.com/events,
 * read 2026-11-16. JT's solo, duo and songwriter-night shows are left out:
 * they don't take the band, so they aren't band gigs. JT can still mark
 * those days busy as "Something else".
 */
const JTSB_GIGS: Gig[] = [
  {
    date: "2027-01-09",
    startTime: "20:00",
    endTime: "00:00",
    venue: "Roadrunner Saloon",
    address: "47801 N Black Canyon Hwy, New River, AZ 85087",
    url: "https://jtsheetsmusic.com/event/roadrunner-saloon-3/",
  },
].map((g) => ({ id: `jtsb-${g.date}`, bandId: "jt-sheets-band", ...g }));

export const GIGS: Gig[] = [...WMH_GIGS, ...JTSB_GIGS];

export const MARKS: Mark[] = [];
