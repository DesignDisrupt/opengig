"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Top-right switch between your own calendar and the booking view. */
export function ViewToggle({ meId }: { meId: string }) {
  const path = usePathname();
  const items = [
    { href: `/m/${meId}`, label: "My Calendar", active: path.startsWith("/m/") },
    { href: "/dates", label: "Booking Dates", active: path.startsWith("/dates") },
  ];
  return (
    <nav aria-label="View" className="flex rounded-full bg-surface p-1">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={`flex h-8 items-center rounded-full px-3 text-[13px] whitespace-nowrap transition-colors duration-200 sm:px-4 ${
            it.active ? "bg-bg font-medium shadow-sm" : "text-muted hover:text-fg"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
