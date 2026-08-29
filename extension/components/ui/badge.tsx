import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Category marker for a suggestion's `kind` (Deadline, Event, Login…).
 *
 * A colored dot + mono label ("• Deadline"), not a filled pill — quieter,
 * smaller, and reads as metadata sitting next to the date rather than a tag
 * chip. Monochrome by design: every marker in a list looks the same, so the
 * badge differentiates by its *text*, not by color. Color in this app is
 * reserved for "this needs you" (accent) and real success/error states — a
 * category label is neither.
 *
 * Visual treatment lives in `.kind-tag` (see assets/tailwind.css).
 */
export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("kind-tag", className)}>{children}</span>;
}
