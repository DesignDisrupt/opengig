import {
  date,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
} from "drizzle-orm/pg-core";

export const people = pgTable("people", {
  id: text().primaryKey(),
  name: text().notNull(),
});

export const bands = pgTable("bands", {
  id: text().primaryKey(),
  name: text().notNull(),
});

/** Rosters. A person can be on several bands. */
export const bandMembers = pgTable(
  "band_members",
  {
    bandId: text()
      .notNull()
      .references(() => bands.id, { onDelete: "cascade" }),
    personId: text()
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.bandId, t.personId] })],
);

/**
 * Gigs and gig holds. Only band and date are required; everything else is
 * filled in later. Not unique on (band, date) — a band can play twice a day.
 */
export const gigs = pgTable(
  "gigs",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bandId: text()
      .notNull()
      .references(() => bands.id, { onDelete: "cascade" }),
    date: date({ mode: "string" }).notNull(),
    startTime: time(),
    endTime: time(),
    venue: text(),
    address: text(),
    url: text(),
    note: text(),
    createdBy: text().references(() => people.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("gigs_date_idx").on(t.date)],
);

export const markStatus = pgEnum("mark_status", ["free", "maybe", "busy"]);

/** A member's own mark. No row means free. One mark per person per day. */
export const marks = pgTable(
  "marks",
  {
    personId: text()
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    date: date({ mode: "string" }).notNull(),
    status: markStatus().notNull(),
    note: text(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.date] })],
);
