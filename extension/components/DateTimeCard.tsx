import { useMemo } from "react";
import { DateTimeCardProps } from "@/types/schema";
import { formatHumanDate } from "@/utils/event";

/**
 * The date strip — treated as one small crafted widget, not an admin row.
 * A single card: identity + live time + count on top, a hairline, then the
 * day-picker pills. Everything chrome (the date, the time, the pills) is set
 * in Geist Mono; only the day label is content weight.
 */
export function DateTimeCard({
  currentTime,
  eventsCount = 0,
  selectedDate,
  onDateChange,
}: DateTimeCardProps) {
  const displayDate = selectedDate ?? currentTime;
  const isToday = displayDate.toDateString() === currentTime.toDateString();

  const upcomingDays = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const date = new Date(currentTime);
        date.setDate(date.getDate() + i + 1);
        return date;
      }),
    [currentTime]
  );

  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const label = isToday
    ? "Today"
    : displayDate.toLocaleDateString("en-US", { weekday: "long" });

  const clock = currentTime
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    .toLowerCase();

  // One motion spec for every pill, so the strip animates as a unit.
  const pillMotion =
    "transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-95";
  const pillActive = "bg-accent text-accent-foreground shadow-sm";
  const pillIdle = "text-slate-500 hover:bg-slate-100";
  const dayPill = `flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium tabular-nums ${pillMotion}`;

  return (
    <div className="mb-section px-gutter">
      <div className="surface-card px-card py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="type-title">{label}</span>
            <span className="type-meta truncate font-normal text-slate-400">
              {formatHumanDate(toIso(displayDate))}
            </span>
          </div>
          <div className="flex shrink-0 items-baseline gap-2">
            <span className="type-meta tabular-nums text-slate-400">
              {clock}
            </span>
            <span aria-hidden className="text-slate-200">
              |
            </span>
            <span className="type-count">
              {eventsCount} {eventsCount === 1 ? "event" : "events"}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1 border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={() => onDateChange?.(currentTime)}
            className={`mr-0.5 h-7 shrink-0 rounded-full px-2.5 font-mono text-[11px] font-medium ${pillMotion} ${
              isToday ? pillActive : pillIdle
            }`}
            aria-label="Go to today"
          >
            Today
          </button>
          {upcomingDays.map((date) => {
            const active =
              selectedDate &&
              date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onDateChange?.(date)}
                className={`${dayPill} ${active ? pillActive : pillIdle}`}
                aria-label={`Go to ${date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
