import {
  Children,
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Multi-step form, adapted from reactbits.dev/components/stepper. Kept the
 * slide/height animation and the indicator + connector row; restyled to the
 * app palette (accent, slate) and reworked the footer so the last step's
 * button runs the caller's async submit (with a spinner + inline error)
 * instead of auto-advancing into a "completed" state.
 *
 * `canProceed` gates the Continue / submit button — the caller sets it from
 * the current step's field validity; `onStepChange` mirrors the step out so
 * the caller can compute that.
 */

interface StepperProps {
  children: ReactNode;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  canProceed?: boolean;
  busy?: boolean;
  error?: string | null;
  nextLabel?: string;
  completeLabel?: string;
  backLabel?: string;
}

export function Stepper({
  children,
  onStepChange,
  onComplete,
  canProceed = true,
  busy = false,
  error,
  nextLabel = "Continue",
  completeLabel = "Done",
  backLabel = "Back",
}: StepperProps) {
  const steps = Children.toArray(children);
  const total = steps.length;
  const [current, setCurrent] = useState(1);
  const [direction, setDirection] = useState(0);
  const isLast = current === total;

  const go = (next: number) => {
    if (next < 1 || next > total || next === current) return;
    setDirection(next > current ? 1 : -1);
    setCurrent(next);
    onStepChange?.(next);
  };

  const advance = () => {
    if (busy || !canProceed) return;
    if (isLast) onComplete?.();
    else go(current + 1);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        advance();
      }}
      className="mx-auto w-full max-w-[340px] rounded-2xl border border-white/60 bg-white/70 p-6 shadow-[0_10px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl"
    >
      <div className="flex items-center">
        {steps.map((_, i) => {
          const n = i + 1;
          return (
            <Fragment key={n}>
              <StepIndicator
                step={n}
                current={current}
                onClick={() => !busy && n < current && go(n)}
              />
              {i < total - 1 && <StepConnector active={current > n} />}
            </Fragment>
          );
        })}
      </div>

      <StepContent current={current} direction={direction}>
        {steps[current - 1]}
      </StepContent>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      )}

      <div
        className={cn(
          "mt-6 flex items-center",
          current === 1 ? "justify-end" : "justify-between"
        )}
      >
        {current !== 1 && (
          <button
            type="button"
            onClick={() => !busy && go(current - 1)}
            disabled={busy}
            className="rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-40"
          >
            {backLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={busy || !canProceed}
          className="inline-flex h-9 min-w-[104px] items-center justify-center gap-1.5 rounded-full bg-accent px-5 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isLast ? (
            completeLabel
          ) : (
            nextLabel
          )}
        </button>
      </div>
    </form>
  );
}

/** One step's fields. */
export function Step({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function StepIndicator({
  step,
  current,
  onClick,
}: {
  step: number;
  current: number;
  onClick: () => void;
}) {
  const status =
    current === step ? "active" : current < step ? "upcoming" : "done";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={status === "active" ? "step" : undefined}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
        status === "upcoming" && "bg-slate-200 text-slate-500",
        status !== "upcoming" && "bg-accent text-accent-foreground",
        status === "done" ? "cursor-pointer" : "cursor-default"
      )}
    >
      {status === "done" ? <Check className="size-3.5" /> : step}
    </button>
  );
}

function StepConnector({ active }: { active: boolean }) {
  return (
    <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200">
      <div
        className={cn(
          "h-full rounded-full bg-accent transition-[width] duration-300 ease-out",
          active ? "w-full" : "w-0"
        )}
      />
    </div>
  );
}

const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? "18%" : "-18%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? "-18%" : "18%", opacity: 0 }),
};

function StepContent({
  current,
  direction,
  children,
}: {
  current: number;
  direction: number;
  children: ReactNode;
}) {
  const [height, setHeight] = useState<number | "auto">("auto");
  return (
    <motion.div
      className="relative mt-6 overflow-hidden"
      animate={{ height }}
      transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        <SlideStep key={current} direction={direction} onHeight={setHeight}>
          {children}
        </SlideStep>
      </AnimatePresence>
    </motion.div>
  );
}

function SlideStep({
  children,
  direction,
  onHeight,
}: {
  children: ReactNode;
  direction: number;
  onHeight: (h: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) onHeight(ref.current.offsetHeight);
  });
  return (
    <motion.div
      ref={ref}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-x-0 top-0"
    >
      {children}
    </motion.div>
  );
}
