import { useState, type MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import { X } from "lucide-react";
import { RecentActionResponse } from "@/types/schema";
import { formatHumanDate, kindLabel } from "@/utils/event";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * One suggestion in the "Needs review" list / stack — display only. Tapping it
 * opens the detail sheet (PendingReviewModal), where Skip / Task / Calendar
 * and the swipe gesture live. The small X (top-right) dismisses the item: the
 * whole card flings off to the right — rotate + fade, same feel as the swipe
 * card in the sheet — before the reject fires and the cards below slide up.
 *
 * Same visual treatment whether it's in the plain list (1–2 items) or the
 * ScrollStack; the stack wrapper is just a transform host. When stacked, the
 * ScrollStack drives `--veil` (0–1) and the overlay below paints an opaque
 * page-colour wash at that strength, so a receded card dims without letting
 * its text show through the cards in front.
 */
interface PendingActionCardProps {
  action: RecentActionResponse;
  onOpen: () => void;
  onDismiss?: () => void;
}

export function PendingActionCard({
  action,
  onOpen,
  onDismiss,
}: PendingActionCardProps) {
  const [removing, setRemoving] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [0, 340], [0, 10]);
  const opacity = useTransform(x, [0, 120, 340], [1, 1, 0]);

  const dismiss = (e: MouseEvent) => {
    e.stopPropagation();
    if (removing || !onDismiss) return;
    setRemoving(true);
    animate(x, 360, { duration: 0.32, ease: [0.4, 0, 1, 1] });
    window.setTimeout(onDismiss, 300);
  };

  return (
    <motion.div
      role="button"
      tabIndex={removing ? -1 : 0}
      onClick={() => !removing && onOpen()}
      onKeyDown={(e) => {
        if (!removing && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{ x, rotate, opacity }}
      className={cn(
        "relative w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-4 text-left",
        "shadow-[0_4px_14px_-8px_rgb(15_23_42/0.16)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        removing && "pointer-events-none"
      )}
    >
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
        >
          <X className="size-4" />
        </button>
      )}

      <h3 className="type-item-title line-clamp-2 pr-7">{action.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="type-meta">{formatHumanDate(action.date)}</span>
        {action.kind && <Badge>{kindLabel(action.kind)}</Badge>}
      </div>
      {action.notes && (
        <p className="type-body mt-1.5 line-clamp-1 text-slate-400">
          {action.notes}
        </p>
      )}

      {/* Opaque recede wash — strength set by ScrollStack via `--veil`. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl bg-slate-100"
        style={{ opacity: "var(--veil, 0)" }}
      />
    </motion.div>
  );
}
