import { cookies } from "next/headers";
import Link from "next/link";
import { canBook, findMe, ME_COOKIE } from "@/lib/me";
import { ViewToggle } from "./ViewToggle";

/**
 * The header's right side: the My Calendar / Booking Dates toggle and who
 * you are. Before a name is picked there is nothing to navigate to, so it
 * stays empty — the app is linear.
 */
export async function HeaderNav() {
  const me = findMe((await cookies()).get(ME_COOKIE)?.value);
  if (!me) return null;

  return (
    <div className="flex items-center gap-2">
      {canBook(me) && <ViewToggle meId={me.id} />}
      <Link
        href="/?switch=1"
        title={`${me.name} — not you? Switch`}
        aria-label={`Signed in as ${me.name}. Switch person`}
        className="flex items-center gap-2 rounded-full bg-surface p-1 text-[13px] font-medium transition-colors duration-200 hover:bg-line md:pr-3"
      >
        <span className="grid size-8 place-items-center rounded-full bg-fg text-[11px] font-semibold text-bg">
          {me.name.slice(0, 2)}
        </span>
        <span className="hidden md:inline">
          {me.name} <span className="font-normal text-muted">· Switch</span>
        </span>
      </Link>
    </div>
  );
}
