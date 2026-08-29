import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small neutral tag for a suggestion's `kind` (Deadline, Event, Delivery…).
 *
 * Deliberately monochrome: every badge in a list looks the same, so the
 * badge differentiates by its *text*, not by color. Color in this app is
 * reserved for "this needs you" (accent) and real success/error states —
 * a category label is neither.
 */
export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md bg-slate-100 px-1.5 py-0.5",
        "font-sans text-[10.5px] font-semibold leading-none tracking-[0.03em] text-slate-500",
        className
      )}
    >
      {children}
    </span>
  );
}
