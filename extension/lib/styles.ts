/**
 * The one outlined action button, shared by the suggestion cards
 * (Calendar / Task) and the settings drawer (Connect / Disconnect /
 * Reconnect). Two peers of equal weight — never a filled primary among a
 * row of them. Neutral slate with real hover / active / focus states.
 *
 * Use `outlineButton` at its natural size; pass `outlineButtonCompact` as an
 * extra class where vertical space is scarce (the needs-review list).
 */
export const outlineButton =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border " +
  "border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 " +
  "transition-colors hover:bg-slate-50 hover:border-slate-300 " +
  "active:bg-slate-100 active:border-slate-300 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 " +
  "disabled:pointer-events-none disabled:opacity-50";

/** Tighter padding + type for dense lists. Combine with `outlineButton`. */
export const outlineButtonCompact = "px-2.5 py-1 text-[12px]";

/**
 * Quiet destructive action — the settings-drawer "Log out" row. Not a
 * filled red button; a restrained text-weight control that only warms to
 * red on hover, so it reads as final without shouting.
 */
export const quietDestructiveButton =
  "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border " +
  "border-transparent px-3 py-2 text-[13px] font-medium text-slate-500 " +
  "transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 " +
  "disabled:pointer-events-none disabled:opacity-50";
