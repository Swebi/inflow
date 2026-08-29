import { FloatingActionButtonProps } from "@/types/schema";

/**
 * Scan-this-email CTA. The one filled accent control on the main surface.
 *
 * Anchored `absolute` to the Dashboard's `relative` root — NOT `fixed` to
 * the viewport — so it rides above the scroll container without ever being
 * measured against the window. The scroll container (`EventsList`) carries
 * `pb-24` (96px) so the last card always clears this button:
 * 16px offset + 56px button + ~24px breathing room.
 */
export function FloatingActionButton({
  onClick,
  disabled,
  loading,
}: FloatingActionButtonProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4">
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label="Scan this email"
        className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-200 hover:scale-105 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 disabled:opacity-40 disabled:hover:scale-100"
      >
        {loading ? (
          <svg
            className="size-6 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="size-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
