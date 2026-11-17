import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MemberBoard } from "@/components/board/MemberBoard";
import { Page, Skeleton } from "@/components/ui";
import { memberMonth } from "@/lib/board";
import { addMonths, ISO_MONTH, todayISO } from "@/lib/dates";
import { getCalendar } from "@/lib/store";
import { canBook, isManager } from "@/lib/me";
import { bandShort, bandsFor, findPerson } from "@/lib/view";

export default function MemberPage(props: PageProps<"/m/[personId]">) {
  return (
    <Page wide>
      <Suspense fallback={<Skeleton className="h-[560px]" />}>
        <Member {...props} />
      </Suspense>
    </Page>
  );
}

async function Member({ params, searchParams }: PageProps<"/m/[personId]">) {
  const { personId } = await params;
  const person = findPerson(personId);
  if (!person) notFound();

  const q = await searchParams;
  const cal = await getCalendar();
  const today = todayISO();
  const month = typeof q.month === "string" && ISO_MONTH.test(q.month) ? q.month : today.slice(0, 7);
  const href = (m: string) => `/m/${personId}?month=${m}`;

  return (
    <MemberBoard
      personId={personId}
      personName={person.name}
      month={month}
      today={today}
      weeks={memberMonth(cal, personId, month, isManager(person))}
      manager={isManager(person)}
      canBook={canBook(person)}
      bands={cal.bands.map((b) => ({ id: b.id, name: b.name, short: bandShort(b.id) }))}
      myBandIds={bandsFor(cal, personId).map((b) => b.id)}
      prevHref={href(addMonths(month, -1))}
      nextHref={href(addMonths(month, 1))}
      todayHref={href(today.slice(0, 7))}
    />
  );
}
