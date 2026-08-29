/**
 * The one outlined action button, shared by the suggestion cards
 * (Calendar / Task) and the settings drawer (Connect / Disconnect /
 * Reconnect). Two peers of equal weight — never a filled primary among a
 * row of them. Neutral slate, hairline border, real hover / active / focus
 * states, ~32px tall so a 15–20 item review list stays compact.
 *
 * The label sits in the sans; only the icon (a real Google product mark on
 * the card variant) carries identity.
 */
export const outlineButton =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border " +
  "border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-700 " +
  "transition-colors hover:bg-slate-50 hover:border-slate-300 " +
  "active:bg-slate-100 active:border-slate-300 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 " +
  "disabled:pointer-events-none disabled:opacity-50";

/** Even tighter, for the densest lists. Combine with `outlineButton`. */
export const outlineButtonCompact = "h-[30px] px-2.5 text-[12px]";

/**
 * Quiet destructive action — the settings-drawer "Log out" row. Not a
 * filled red button; a restrained control that only warms to red on hover,
 * so it reads as final without shouting.
 */
export const quietDestructiveButton =
  "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border " +
  "border-transparent px-3 py-2 text-[12.5px] font-medium text-slate-500 " +
  "transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 " +
  "disabled:pointer-events-none disabled:opacity-50";

/**
 * The one filled control — the single accent CTA. Used for the drawer Save
 * / Update actions and anywhere a primary confirm is genuinely primary.
 * The FAB is the same fill, shaped as a circle in its own component.
 */
export const accentButton =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg " +
  "bg-accent px-4 text-[13px] font-medium text-accent-foreground " +
  "transition-colors hover:bg-accent/90 active:bg-accent/80 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 " +
  "disabled:pointer-events-none disabled:opacity-40";
