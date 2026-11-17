"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * The sticky header. Flat at the top of the page; once the page moves under
 * it, a hairline and a soft shadow appear so it reads as a layer above.
 */
export function ScrollHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-300 data-[scrolled]:shadow-[0_1px_0_var(--line),0_8px_24px_-12px_rgba(0,0,0,0.18)]"
    >
      {children}
    </header>
  );
}
