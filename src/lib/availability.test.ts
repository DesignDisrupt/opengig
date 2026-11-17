import { describe, expect, it } from "vitest";
import {
  bandDay,
  bandRange,
  eachDay,
  markBusy,
  personDay,
  removeGig,
  setMark,
  updateGig,
  type Calendar,
} from "./availability";
import { BANDS } from "./seed";

const WMH = "whiskey-mountain-highway";
const empty = (): Calendar => ({ bands: BANDS, gigs: [], marks: [] });
let n = 0;
const id = () => `gig-${++n}`;

describe("resolving days", () => {
  it("an unmarked day is free, so an empty calendar works every day", () => {
    expect(personDay(empty(), "brady", "2026-12-01")).toEqual({
      personId: "brady",
      status: "free",
      reason: "default",
    });
    const days = bandRange(empty(), WMH, "2026-12-01", "2026-12-03");
    expect(days.map((d) => d.verdict)).toEqual(["works", "works", "works"]);
  });

  it("a Loveyoubye gig makes its WMH members busy, with the gig as the reason", () => {
    const cal: Calendar = {
      ...empty(),
      gigs: [{ id: "g1", bandId: "loveyoubye", date: "2026-12-05" }],
    };
    const day = bandDay(cal, WMH, "2026-12-05");
    expect(day.verdict).toBe("conflict");
    const busy = day.members.filter((m) => m.status === "busy").map((m) => m.personId);
    expect(busy).toEqual(["jacob", "brando", "cade"]);
    expect(personDay(cal, "brady", "2026-12-05").status).toBe("free");
  });

  it("a maybe, with nobody busy, makes the day maybe", () => {
    const cal = setMark(empty(), "mike", "2026-12-02", "maybe", "depends on work");
    expect(bandDay(cal, WMH, "2026-12-02").verdict).toBe("maybe");
  });

  it("reports double-booking across bands", () => {
    const cal: Calendar = {
      ...empty(),
      gigs: [
        { id: "a", bandId: "jt-sheets-band", date: "2026-12-07" },
        { id: "b", bandId: "loveyoubye", date: "2026-12-07" },
      ],
    };
    const cade = personDay(cal, "cade", "2026-12-07");
    expect(cade.status === "busy" && cade.reason === "gig" && cade.gigs.length).toBe(2);
  });
});

describe("marking busy", () => {
  it("'other' makes only that member busy, with their note", () => {
    const { cal, gig } = markBusy(empty(), "mike", "2026-12-10", {
      kind: "other",
      note: "wedding",
    });
    expect(gig).toBeUndefined();
    expect(personDay(cal, "mike", "2026-12-10")).toMatchObject({
      status: "busy",
      reason: "self",
      note: "wedding",
    });
    expect(personDay(cal, "brady", "2026-12-10").status).toBe("free");
  });

  it("picking a band puts a gig hold on the day for every member of that band", () => {
    const { cal, gig } = markBusy(
      empty(),
      "phil",
      "2026-12-12",
      { kind: "band", bandId: "loveyoubye" },
      id,
    );
    expect(gig).toMatchObject({ bandId: "loveyoubye", date: "2026-12-12", createdBy: "phil" });
    for (const p of ["phil", "jacob", "brando", "jt", "cade"]) {
      expect(personDay(cal, p, "2026-12-12").status).toBe("busy");
    }
    expect(personDay(cal, "brady", "2026-12-12").status).toBe("free");
    expect(bandDay(cal, WMH, "2026-12-12").verdict).toBe("conflict");
  });

  it("a second member picking the same band and day reuses the gig", () => {
    const first = markBusy(empty(), "jt", "2026-12-13", { kind: "band", bandId: "jt-sheets-band" }, id);
    const second = markBusy(first.cal, "cade", "2026-12-13", { kind: "band", bandId: "jt-sheets-band" }, id);
    expect(second.gig?.id).toBe(first.gig?.id);
    expect(second.cal.gigs).toHaveLength(1);
  });

  it("a member cannot pick a band they are not on", () => {
    expect(() =>
      markBusy(empty(), "brady", "2026-12-14", { kind: "band", bandId: "loveyoubye" }, id),
    ).toThrow(/not on Loveyoubye/);
  });
});

describe("gig details", () => {
  it("time and venue are added later, and moving the gig moves the busy day", () => {
    const { cal, gig } = markBusy(empty(), "jt", "2026-12-06", { kind: "band", bandId: "jt-sheets-band" }, id);
    const later = updateGig(cal, gig!.id, { startTime: "21:00", venue: "The Basement", date: "2026-12-05" });
    expect(later.gigs[0]).toMatchObject({ startTime: "21:00", venue: "The Basement" });
    expect(personDay(later, "jt", "2026-12-05").status).toBe("busy");
    expect(personDay(later, "jt", "2026-12-06").status).toBe("free");
  });

  it("cancelling a gig returns members to their own marks", () => {
    const marked = setMark(empty(), "jacob", "2026-12-20", "maybe");
    const { cal, gig } = markBusy(marked, "cade", "2026-12-20", { kind: "band", bandId: WMH }, id);
    expect(personDay(cal, "jacob", "2026-12-20").status).toBe("busy");
    expect(personDay(removeGig(cal, gig!.id), "jacob", "2026-12-20").status).toBe("maybe");
  });
});

it("walks dates across a month boundary", () => {
  expect(eachDay("2026-11-30", "2026-12-02")).toEqual(["2026-11-30", "2026-12-01", "2026-12-02"]);
});

it("WMH's published shows make its members busy on those nights", async () => {
  const { GIGS } = await import("./seed");
  const cal: Calendar = { bands: BANDS, gigs: GIGS, marks: [] };
  expect(GIGS.filter((g) => g.bandId === WMH)).toHaveLength(9);
  expect(bandDay(cal, WMH, "2026-12-18").verdict).toBe("conflict");
  const jt = personDay(cal, "jt", "2026-12-18"); // not on WMH
  expect(jt.status).toBe("free");
  const cade = personDay(cal, "cade", "2026-12-18");
  expect(cade.status === "busy" && cade.reason === "gig" && cade.gigs[0].venue).toBe("The Roadhouse");
});

it("JT Sheets Band's one Full Band show holds JT, Jacob, Brando and Cade, not Brady", async () => {
  const { GIGS } = await import("./seed");
  const cal: Calendar = { bands: BANDS, gigs: GIGS, marks: [] };
  expect(GIGS.filter((g) => g.bandId === "jt-sheets-band").map((g) => g.date)).toEqual(["2027-01-09"]);
  for (const p of ["jt", "jacob", "brando", "cade"]) {
    expect(personDay(cal, p, "2027-01-09").status).toBe("busy");
  }
  expect(personDay(cal, "brady", "2027-01-09").status).toBe("free");
  expect(bandDay(cal, WMH, "2027-01-09").verdict).toBe("conflict");
});
