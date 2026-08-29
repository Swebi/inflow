/**
 * Inflow brand mark: a downward arrow resolving into a baseline — mail
 * "flowing in" and settling into your day — next to the wordmark.
 *
 * Monochrome slate-900, sized to sit inline in the panel header. The same
 * glyph is exported at icon sizes for the Chrome toolbar.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={`flex select-none items-center gap-1.5 ${className ?? ""}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="text-slate-900"
      >
        <path
          d="M8 2.5v7"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.75 6.75 8 10l3.25-3.25"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 13.25h10"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-heading text-sm font-semibold tracking-tight text-slate-900">
        inflow
      </span>
    </span>
  );
}
