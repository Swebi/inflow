import { lazy, Suspense, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import gmailIcon from "@/assets/gmail.svg";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";
import telegramIcon from "@/assets/telegram.svg";

/**
 * Shared shell for the three unauthenticated screens (Landing / Sign in /
 * Sign up): the LiquidEther fluid background, the wordmark top-left, and a
 * centered content slot. Landing also shows the glass "Works with" footer
 * row (`worksWith`); the stepper screens leave it off.
 *
 * `three` is heavy and only needed pre-auth, so the background is lazy-loaded
 * (the Dashboard bundle never pulls it); `prefers-reduced-motion` swaps it
 * for a still tint.
 */

const LiquidEther = lazy(() => import("@/components/LiquidEther"));

// Blues drawn from the app's one accent token — no new hues here.
const ETHER_COLORS = ["#dfe6f6", "#9db2ea", "#346bd6"];

export function AuthScene({
  children,
  worksWith = false,
}: {
  children: ReactNode;
  worksWith?: boolean;
}) {
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {reduceMotion ? (
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_15%,rgba(74,99,217,0.14),transparent_60%)]" />
        ) : (
          <Suspense fallback={null}>
            <LiquidEther
              colors={ETHER_COLORS}
              className="absolute inset-0"
              resolution={0.45}
              mouseForce={12.5}
              cursorSize={51}
              autoIntensity={1.4}
              autoSpeed={0.8}
              takeoverDuration={0.3}
            />
          </Suspense>
        )}
        {/* Calm the top and bottom edges so text never fights the fluid. */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/75 via-transparent to-slate-100/85" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-gutter py-6">
        <Link
          to="/welcome"
          aria-label="Inflow — back to start"
          className="w-fit"
        >
          <BrandMark />
        </Link>

        <div className="flex flex-1 flex-col justify-center py-8">
          {children}
        </div>

        {worksWith && (
          <div className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/55 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur-xl">
            <span className="type-meta text-slate-500">Works with</span>
            <span className="flex items-center gap-4">
              <img src={gmailIcon} alt="Gmail" className="size-4" />
              <img
                src={calendarIcon}
                alt="Google Calendar"
                className="size-4"
              />
              <img src={tasksIcon} alt="Google Tasks" className="size-4" />
              <img src={telegramIcon} alt="Telegram" className="size-4" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
