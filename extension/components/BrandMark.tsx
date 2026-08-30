/**
 * Inflow brand mark: the extension's own icon (the blue flow glyph shipped
 * in /public/icon, the same art Chrome shows in the toolbar) next to the
 * wordmark — one identity anchor, placed identically on every auth screen.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={`flex select-none items-center gap-1.5 ${className ?? ""}`}
    >
      <img
        src="/icon/48.png"
        width="18"
        height="18"
        alt=""
        aria-hidden="true"
        className="size-4.5"
      />
      <span className="font-heading text-sm font-semibold tracking-tight text-slate-900">
        inflow
      </span>
    </span>
  );
}
