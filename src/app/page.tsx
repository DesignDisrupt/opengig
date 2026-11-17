import { chooseMe } from "@/app/actions";
import { BandDot, Page, Rows, SectionLabel, Title } from "@/components/ui";
import { BANDS, PEOPLE } from "@/lib/seed";

/**
 * Step one: who are you? Nothing else in the app shows until this is picked
 * (see proxy.ts). Once picked, "/" skips straight past here; the header's
 * Switch link comes back with ?switch=1.
 */
export default function Home() {
  const players = PEOPLE.filter((p) => p.role !== "manager");
  const managers = PEOPLE.filter((p) => p.role === "manager");

  return (
    <Page>
      <Title sub="Pick your name to get started. This device will remember it.">Who’s this?</Title>

      <form action={chooseMe}>
        <SectionLabel>Band members</SectionLabel>
        <Rows>
          {players.map((p) => (
            <NameRow key={p.id} id={p.id} name={p.name}>
              <span className="flex gap-1">
                {BANDS.filter((b) => b.memberIds.includes(p.id)).map((b) => (
                  <BandDot key={b.id} bandId={b.id} />
                ))}
              </span>
            </NameRow>
          ))}
        </Rows>

        <SectionLabel className="mt-10">Manager</SectionLabel>
        <Rows>
          {managers.map((p) => (
            <NameRow key={p.id} id={p.id} name={p.name}>
              <span className="text-[13px] text-muted">Books gigs for every band</span>
            </NameRow>
          ))}
        </Rows>
      </form>
    </Page>
  );
}

function NameRow({ id, name, children }: { id: string; name: string; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      name="personId"
      value={id}
      className="flex w-full items-center gap-4 py-3 text-left transition-colors duration-200 hover:bg-surface/60"
    >
      <span className="grid size-10 place-items-center rounded-full bg-surface text-[14px] font-semibold">
        {name.slice(0, 2)}
      </span>
      <span className="flex-1 text-[16px] font-medium">{name}</span>
      {children}
      <span aria-hidden className="pr-1 text-faint">
        ›
      </span>
    </button>
  );
}
