# Band Gig Calendar (working title)

A simple shared calendar for a band. Members mark their availability ahead of
time; the band manager sees which dates work for everyone and books gigs on them.

## Who uses it

- **Band members** — open the band link on their phone, pick their name, and
  mark days as free / maybe / busy.
- **Band manager** — sees everyone's availability overlaid, gets a list of
  dates where the whole band is free, and confirms a date as a gig.

## Decisions (2026-11-16)

| Topic | Decision |
|-------|----------|
| Platform | Mobile-first web app — Next.js, deployed on Vercel. Add-to-home-screen, no app store. |
| Sign-in | One private band link; members tap their name. No passwords. |
| Availability | Per whole day: **Free / Maybe / Busy**, each with an optional note ("free after 7pm"). **Every day starts as Free**; members only mark the exceptions. |
| Bands | Built for one band, with the data shaped so more bands can be added without a rewrite. |
| Storage | **Neon Postgres, free tier**, via Drizzle ORM. Sleeps when idle (a short wake-up on the first request) but never pauses for good. Kept free on purpose. |

### The three bands and gig auto-busy

Members overlap across three bands:

- **Whiskey Mountain Highway**
- **JT Sheets Band**
- **Loveyoubye**

Each band has its own roster in the app (a person can be on more than one).

| Person | Whiskey Mountain Highway | JT Sheets Band | Loveyoubye |
|--------|:---:|:---:|:---:|
| Brady  | ✓ |   |   |
| Mike   | ✓ |   |   |
| Phil   |   |   | ✓ |
| JT     |   | ✓ | ✓ |
| Jacob  | ✓ | ✓ | ✓ |
| Brando | ✓ | ✓ | ✓ |
| Cade   | ✓ | ✓ | ✓ |

Seven people. Jacob, Brando and Cade are in all three bands, so any gig from
any band takes them out — they are the constraint on almost every date.

Adam is the manager and is not on any roster.

### Marking a day busy

When a member marks a day **Busy**, they pick a reason:

- **Other** — busy for anything that isn't a gig, with an optional note.
  Only their own day changes.
- **One of their bands** — puts a generic **gig hold** on that day for that
  band. Every member of the band is now busy that day, shown as **Gig with
  &lt;band&gt;**, without anyone else entering it. A member can only pick
  bands they are on, and if the band already has a gig that day the hold is
  reused rather than duplicated.

A gig hold starts bare. **Every other detail is optional and added later**,
and the date can be moved. What a gig *can* carry follows what
whiskeymountainhighway.com lists for a show:

| Field | Example |
|-------|---------|
| Start time | 8:00 PM |
| End time | 12:00 AM (earlier than the start means past midnight) |
| Venue | The Roadhouse |
| Address | 6900 E Cave Creek Rd, Cave Creek, AZ 85331 |
| Link | the venue's or event's page |
| Note | anything else |

Seeded gigs, read 2026-11-16, in `src/lib/seed.ts`:

- **Whiskey Mountain Highway** — all nine shows on whiskeymountainhighway.com
  (Nov 2026 – Dec 2027).
- **JT Sheets Band** — only the **Full Band** listings on
  jtsheetsmusic.com/events (one so far: Jan 9, 2027, Roadrunner Saloon). JT's
  solo, duo and songwriter-night shows are left out because they don't take
  the band.

Gig busy is derived, not copied: move or cancel the gig and every member's day
updates with it. A gig also overrides a member's own mark for that day; cancel
it and their own mark comes back.

### Entering gigs

Besides a member's busy pick, anyone with the band link can add, edit, move
or cancel a gig for any band. In
practice that is Adam for now, but it stays open to everyone — no roles or
permissions to build.

### The "dates that work" view

One shared view that factors in everything: every member's own marks plus all
three bands' gigs.

- Its main job is booking **Whiskey Mountain Highway**: for a date range it
  lists days when all five WMH members are free, with Maybe days shown
  separately.
- It defaults to WMH but can switch to either other band, since the same
  logic answers "when can JT Sheets Band play?".
- Each day shows who is out and why, so Adam sees "Jacob, Brando, Cade —
  Gig with Loveyoubye" rather than a bare conflict.

## First-pass scope (MVP)

1. The three bands, their rosters (overlapping), and gig dates per band.
2. Month view; each member marks their own days (free / maybe / busy, note);
   their bands' gigs show as busy automatically.
3. Manager view: per-day roll-up (all free / some maybe / conflicts, with
   who and why), plus "dates that work for everyone" for a chosen range.
4. Confirm a date as a gig so it shows on everyone's calendar.

## Screens

| Route | What it's for |
|-------|---------------|
| `/` | Pick your name; upcoming gigs by month |
| `/m/[person]` | Your month — tap a day to change it |
| `/m/[person]/[date]` | Free / Maybe / Busy; Busy asks "a gig with one of your bands, or something else?" |
| `/dates` | Dates that work — opens on WMH, switch band, "Open dates" or "Every day", Book |
| `/gigs/[id]` | A gig's details (all optional), and cancel |

Design: minimal, phone-first, patterned on Mobbin references (Peerspace /
Tonal / Monzo calendars, Revolut and Luma segmented controls, Lightyear and
Meetup agenda lists). Colour carries meaning only — green for "everyone's
free", one colour per band for its gigs. In the calendar, Maybe is a dashed
ring and Busy a grey struck-through disc, so no status can be mistaken for a
band. Tokens live in `src/app/globals.css`.

Without `DATABASE_URL` the app runs on an in-memory copy of the seed, so it
can be tried before Neon exists; changes there reset when the server restarts.

## Code

    src/lib/types.ts         people, bands, gigs, marks, resolved days
    src/lib/seed.ts          the three rosters and WMH's published shows
    src/db/schema.ts         Postgres tables: people, bands, band_members, gigs, marks
    src/db/seed.ts           loads seed.ts into the database; safe to re-run
    drizzle/                 generated SQL migrations
    src/lib/store.ts         Neon when DATABASE_URL is set, in-memory seed otherwise
    src/app/actions.ts       the server actions every form posts to
    src/components/ui.tsx    shared pieces: segmented control, date tile, rows, buttons
    src/lib/availability.ts  day resolution, the per-band verdict, and the changes
                             (setMark, markBusy, updateGig, removeGig)

A day for a band is **works** (everyone free), **maybe** (nobody busy, someone
said maybe) or **conflict** (someone busy). A day nobody marked is free.

    npm run dev        # localhost:3000
    npm test           # vitest
    npm run typecheck
    npm run lint
    npm run build

## Database setup (once)

1. Create a free Neon project — either at neon.tech, or from the Vercel
   project's **Storage → Neon** tab, which also sets `DATABASE_URL` on Vercel.
2. Copy `.env.example` to `.env.local` and paste the connection string.
3. Create the tables, then load the rosters and gigs:

       npm run db:migrate
       npm run db:seed

After a schema change: `npm run db:generate`, then `npm run db:migrate`.
`npm run db:studio` opens a browser view of the tables.

## Still open

- Name.
- Notifications when a gig is confirmed or availability is needed.
