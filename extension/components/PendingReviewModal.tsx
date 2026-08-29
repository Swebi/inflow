import { useEffect, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "motion/react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { RecentActionResponse } from "@/types/schema";
import { formatHumanDate, kindLabel } from "@/utils/event";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";

/**
 * The detail sheet for one pending suggestion — opened by tapping the front
 * card of the review stack.
 *
 * Shows the item in full (no clamp on title or notes), then two ways to
 * resolve it:
 *  - Drag the card. Left past the threshold → Skip; right past it → Calendar
 *    (the fast path). The card rotates and follows the pointer, and a colored
 *    reveal grows in behind it — muted from the left, accent from the right —
 *    so the commit is felt, not a snap. On open the card gives a small nudge
 *    and the edge chevrons pulse, so the gesture is discoverable without a
 *    line of instructions.
 *  - The action row underneath: Skip / Task / Calendar. Task lives here only,
 *    on purpose — a left/right drag is binary, so the third outcome stays an
 *    explicit button rather than getting crammed onto the gesture.
 *
 * This tactile treatment is deliberately scoped to the review flow; the rest
 * of the app stays plain lists and forms.
 */

interface PendingReviewModalProps {
  action: RecentActionResponse | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSkip: () => void;
  onCalendar: () => void;
  onTask: () => void;
}

const COMMIT_PX = 96;
const COMMIT_VELOCITY = 550;
const FLING_PX = 460;

export function PendingReviewModal({
  action,
  busy,
  error,
  onClose,
  onSkip,
  onCalendar,
  onTask,
}: PendingReviewModalProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-9, 9]);
  const skipReveal = useTransform(x, [-130, -24], [1, 0]);
  const calReveal = useTransform(x, [24, 130], [0, 1]);

  // New item in focus — reset the drag, then play a one-time "you can swipe
  // this" nudge once the sheet has settled.
  useEffect(() => {
    if (!action) return;
    x.set(0);
    const t = setTimeout(() => {
      animate(x, [0, 26, -20, 12, 0], {
        duration: 1.15,
        ease: "easeInOut",
      });
    }, 450);
    return () => clearTimeout(t);
  }, [action?.id, x]);

  // A failed commit leaves the card flung off-screen; bring it back.
  useEffect(() => {
    if (error) animate(x, 0, { type: "spring", stiffness: 400, damping: 32 });
  }, [error, x]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (busy) return;
    const committed =
      Math.abs(info.offset.x) > COMMIT_PX ||
      Math.abs(info.velocity.x) > COMMIT_VELOCITY;
    if (committed && info.offset.x > 0) {
      animate(x, FLING_PX, { duration: 0.22, ease: "easeOut" });
      onCalendar();
    } else if (committed) {
      animate(x, -FLING_PX, { duration: 0.22, ease: "easeOut" });
      onSkip();
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 32 });
    }
  };

  return (
    <AnimatePresence>
      {action && (
        <div
          key="review-modal"
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Review suggestion"
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && onClose()}
          />

          <motion.div
            className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-slate-200 bg-white px-gutter pb-6 pt-3"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 330 }}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-slate-200" />

            <div className="mb-2 flex items-center justify-between">
              <span className="type-label">Review</span>
              <button
                type="button"
                onClick={() => !busy && onClose()}
                aria-label="Close"
                disabled={busy}
                className="flex size-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Swipeable detail card, the reveals behind it, and the pulsing
                edge chevrons that hint the gesture. */}
            <div className="relative">
              <motion.div
                style={{ opacity: skipReveal }}
                className="pointer-events-none absolute inset-0 flex items-center justify-start rounded-xl bg-slate-200 px-5"
              >
                <span className="type-label flex items-center gap-1.5 text-slate-600">
                  <X className="size-3.5" />
                  Skip
                </span>
              </motion.div>
              <motion.div
                style={{ opacity: calReveal }}
                className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-xl bg-accent px-5"
              >
                <span className="type-label flex items-center gap-1.5 text-accent-foreground">
                  Calendar
                  <img
                    src={calendarIcon}
                    alt=""
                    className="size-3.5 brightness-0 invert"
                    aria-hidden
                  />
                </span>
              </motion.div>

              <motion.div
                drag={busy ? false : "x"}
                dragMomentum={false}
                dragElastic={1}
                onDragEnd={handleDragEnd}
                style={{ x, rotate }}
                className="relative cursor-grab touch-pan-y select-none rounded-xl border border-slate-200 bg-white p-4 active:cursor-grabbing"
              >
                <h3 className="type-title text-[16px]">{action.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="type-meta">
                    {formatHumanDate(action.date)}
                  </span>
                  {action.kind && <Badge>{kindLabel(action.kind)}</Badge>}
                </div>
                {action.notes && (
                  <p className="type-body mt-2.5 max-h-[38vh] overflow-y-auto whitespace-pre-line">
                    {action.notes}
                  </p>
                )}

                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                    <Loader2 className="size-5 animate-spin text-slate-400" />
                  </div>
                )}
              </motion.div>

              {!busy && (
                <>
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-1 flex items-center text-slate-300"
                    animate={{ x: [0, -4, 0], opacity: [0.25, 0.6, 0.25] }}
                    transition={{
                      duration: 1.9,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ChevronLeft className="size-4" />
                  </motion.div>
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -right-1 flex items-center text-slate-300"
                    animate={{ x: [0, 4, 0], opacity: [0.25, 0.6, 0.25] }}
                    transition={{
                      duration: 1.9,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ChevronRight className="size-4" />
                  </motion.div>
                </>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">
                {error}
              </p>
            )}

            {/* Tinder-style action row — three equal circular buttons. Skip is
                a lighter outline; Task and Calendar carry their real Google
                marks. */}
            <div className="mt-5 flex items-start justify-center gap-7">
              <ActionButton label="Skip" onClick={onSkip} disabled={busy} muted>
                <X className="size-6" />
              </ActionButton>
              <ActionButton label="Task" onClick={onTask} disabled={busy}>
                <img src={tasksIcon} alt="" className="size-6" aria-hidden />
              </ActionButton>
              <ActionButton label="Calendar" onClick={onCalendar} disabled={busy}>
                <img src={calendarIcon} alt="" className="size-6" aria-hidden />
              </ActionButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  children,
  muted,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "flex size-14 items-center justify-center rounded-full bg-white transition-transform",
          "active:scale-90 disabled:pointer-events-none disabled:opacity-40",
          muted
            ? "border border-slate-200 text-slate-400"
            : "border border-slate-200 shadow-sm"
        )}
      >
        {children}
      </button>
      <span className="type-label">{label}</span>
    </div>
  );
}
