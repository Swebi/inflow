import { EventCardProps } from "@/types/schema";
import { formatHumanDate, kindLabel } from "@/utils/event";
import { Badge } from "@/components/ui/badge";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";

function formatTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatTimeDisplay(time: string): string {
  if (time.includes(" - ")) {
    const [start, end] = time.split(" - ");
    return `${formatTimeTo12Hour(start)} - ${formatTimeTo12Hour(end)}`;
  }
  return formatTimeTo12Hour(time);
}

/**
 * A resolved item in the Recents / Calendar / Tasks history. Same shape as a
 * suggestion card but calmer — it's already been dealt with. Title at
 * list-item weight, a mono metadata line, the real Google product mark for
 * where it landed.
 */
export function EventCard({ event, variant }: EventCardProps) {
  const isDark = variant === "dark";
  const isCalendar = event.source === "google-calendar";

  return (
    <div
      className={
        isDark
          ? "rounded-xl border border-slate-700 bg-slate-800 p-card"
          : "surface-card p-card transition-shadow hover:shadow-md"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={
            isDark
              ? "line-clamp-2 flex-1 font-heading text-[13px] font-medium leading-snug tracking-[-0.005em] text-white"
              : "type-item-title line-clamp-2 flex-1"
          }
        >
          {event.title}
        </h3>
        <img
          src={isCalendar ? calendarIcon : tasksIcon}
          alt={isCalendar ? "Google Calendar" : "Google Tasks"}
          className="mt-0.5 size-4 shrink-0"
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-x-2 gap-y-1">
          <span
            className={
              isDark
                ? "font-mono text-[11px] tracking-[-0.01em] text-slate-400"
                : "type-meta"
            }
          >
            {formatHumanDate(event.date)}
          </span>
          {event.kind && !isDark && <Badge>{kindLabel(event.kind)}</Badge>}
        </div>
        {event.time && (
          <span
            className={
              isDark
                ? "shrink-0 font-mono text-[11px] tracking-[-0.01em] text-slate-400"
                : "type-meta shrink-0"
            }
          >
            {formatTimeDisplay(event.time)}
          </span>
        )}
      </div>
    </div>
  );
}
