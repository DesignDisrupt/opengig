import { chooseMe } from "@/app/actions";
import { BrandMark } from "@/components/Brand";
import { BandDot } from "@/components/ui";
import { initialsOf } from "@/lib/me";
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
    <main className="flex flex-1 justify-center px-5 pt-8 pb-20 md:pt-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <BrandMark className="mx-auto mb-5 size-12" />
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">Who’s this?</h1>
          <p className="mt-1.5 text-[15px] text-muted">Pick your name. This device will remember it.</p>
        </div>

        <form action={chooseMe} className="space-y-6">
          <Group label="Band members">
            {players.map((p) => (
              <NameRow key={p.id} id={p.id} name={p.name} initials={initialsOf(p)}>
                <span className="flex gap-1">
                  {BANDS.filter((b) => b.memberIds.includes(p.id)).map((b) => (
                    <BandDot key={b.id} bandId={b.id} />
                  ))}
                </span>
              </NameRow>
            ))}
          </Group>

          <Group label="Manager">
            {managers.map((p) => (
              <NameRow key={p.id} id={p.id} name={p.name} initials={initialsOf(p)}>
                <span className="text-[13px] text-muted">Books every band</span>
              </NameRow>
            ))}
          </Group>
        </form>
      </div>
    </main>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{label}</h2>
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-bg shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {children}
      </div>
    </section>
  );
}

function NameRow({
  id,
  name,
  initials,
  children,
}: {
  id: string;
  name: string;
  initials: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      name="personId"
      value={id}
      className="group flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors duration-200 hover:bg-surface/70"
    >
      <span className="grid size-9 place-items-center rounded-full bg-surface text-[13px] font-semibold transition-colors duration-200 group-hover:bg-fg group-hover:text-bg">
        {initials}
      </span>
      <span className="flex-1 text-[15px] font-medium">{name}</span>
      {children}
      <span aria-hidden className="text-faint transition-transform duration-200 group-hover:translate-x-0.5">
        ›
      </span>
    </button>
  );
}
