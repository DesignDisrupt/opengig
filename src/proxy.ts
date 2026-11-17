/**
 * The app is linear: pick who you are, then see the calendars.
 *
 * - No name picked → every page except the picker sends you to it.
 * - Name picked → "/" goes straight to your landing page; "/?switch=1"
 *   shows the picker again so someone else can choose.
 * - "/m/<someone else>" → your landing page. You edit only your own days.
 * - "/dates" and "/gigs/…" are for people who book; others go to their calendar.
 *   The manager's own "/m/adam" is every band's gigs in one calendar.
 */
import { NextResponse, type NextRequest } from "next/server";
import { canBook, findMe, landingFor, ME_COOKIE } from "@/lib/me";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const me = findMe(request.cookies.get(ME_COOKIE)?.value);
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (pathname === "/") {
    return me && !searchParams.has("switch") ? go(landingFor(me)) : NextResponse.next();
  }

  if (!me) return go("/");

  const member = pathname.match(/^\/m\/([^/]+)/);
  if (member && member[1] !== me.id) return go(landingFor(me));

  // Booking Dates and gig pages are for the people who book (Adam, Brady).
  if ((pathname.startsWith("/dates") || pathname.startsWith("/gigs/")) && !canBook(me)) {
    return go(landingFor(me));
  }

  return NextResponse.next();
}

export const config = {
  // Pages only: not Next's own files, static assets, or the favicon.
  matcher: ["/((?!_next/|favicon.ico|.*\\.[a-z0-9]+$).*)"],
};
