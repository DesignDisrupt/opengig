/**
 * The OpenGig mark: a record — a ring with its centre dot — on a rounded
 * tile. Drawn in currentColor so it follows the theme.
 */
export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="var(--bg)" strokeWidth="2.4" />
      <circle cx="16" cy="16" r="2.6" fill="var(--bg)" />
    </svg>
  );
}

export function Wordmark({ large = false }: { large?: boolean }) {
  return (
    <span className={`flex items-center gap-2 font-semibold tracking-[-0.02em] ${large ? "text-[22px]" : "text-[16px]"}`}>
      <BrandMark className={large ? "size-9" : "size-7"} />
      <span>
        Open<span className="text-muted">Gig</span>
      </span>
    </span>
  );
}
