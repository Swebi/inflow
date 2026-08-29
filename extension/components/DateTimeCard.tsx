import { DateTimeCardProps } from "@/types/schema";
import { formatHumanDate } from "@/utils/event";

export function DateTimeCard({
  currentTime,
  eventsCount = 0,
  selectedDate,
  onDateChange,
}: DateTimeCardProps) {
  const displayDate = selectedDate ?? currentTime;
  const isToday = displayDate.toDateString() === currentTime.toDateString();

  const upcomingDays = Array.from({ length: 4 }, (_, i) => {
    const date = new Date(currentTime);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const label = isToday
    ? "Today"
    : displayDate.toLocaleDateString("en-US", { weekday: "short" });

  const pill =
    "w-7 h-7 flex items-center justify-center text-xs rounded-full transition-colors shrink-0";
  const pillActive = "bg-accent text-accent-foreground";
  const pillIdle = "text-slate-500 hover:bg-slate-100";

  return (
    <div className="mb-4 px-4">
      <div className="surface-card px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="type-title">{label}</span>
            <span className="type-meta truncate font-normal">
              {formatHumanDate(toIso(displayDate))}
            </span>
          </div>
          <p className="type-meta shrink-0 font-normal tabular-nums text-slate-400">
            {eventsCount} {eventsCount === 1 ? "event" : "events"}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDateChange?.(currentTime)}
            className={`px-2.5 h-7 text-xs rounded-full transition-colors shrink-0 ${
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
                className={`${pill} ${active ? pillActive : pillIdle}`}
                aria-label={`Go to ${date.toLocaleDateString("en-US", {
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
