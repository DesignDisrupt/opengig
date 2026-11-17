/**
 * Loads the rosters and WMH's published shows. Safe to re-run: every insert
 * skips rows that already exist, so it never overwrites edits made in the app.
 *
 *     npm run db:seed
 */
import { BANDS, GIGS, PEOPLE } from "../lib/seed";
import { db, schema } from "./index";

async function main() {
  await db
    .insert(schema.people)
    .values(PEOPLE.map(({ id, name }) => ({ id, name })))
    .onConflictDoNothing();
  await db
    .insert(schema.bands)
    .values(BANDS.map(({ id, name }) => ({ id, name })))
    .onConflictDoNothing();
  await db
    .insert(schema.bandMembers)
    .values(BANDS.flatMap((b) => b.memberIds.map((personId) => ({ bandId: b.id, personId }))))
    .onConflictDoNothing();
  const added = await db
    .insert(schema.gigs)
    .values(GIGS)
    .onConflictDoNothing()
    .returning({ id: schema.gigs.id });

  console.log(
    `Seeded ${PEOPLE.length} people, ${BANDS.length} bands; ${added.length} of ${GIGS.length} gigs were new.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
