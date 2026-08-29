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

export function EventCard({ event, variant }: EventCardProps) {
  const isLight = variant === "light";
  const isCalendar = event.source === "google-calendar";

  return (
    <div
      className={
        isLight
          ? "surface-card p-3 transition-shadow hover:shadow-md"
          : "rounded-2xl border border-slate-700 bg-slate-800 p-3"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={
            isLight
              ? "type-item-title line-clamp-2 flex-1"
              : "flex-1 line-clamp-2 font-heading text-[13px] font-medium leading-snug text-white"
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
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={isLight ? "type-meta" : "text-[12px] text-slate-300"}
          >
            {formatHumanDate(event.date)}
          </span>
          {event.kind && isLight && <Badge>{kindLabel(event.kind)}</Badge>}
        </div>
        {event.time && (
          <span
            className={
              isLight
                ? "type-meta shrink-0"
                : "shrink-0 text-[12px] text-slate-300"
            }
          >
            {formatTimeDisplay(event.time)}
          </span>
        )}
      </div>
    </div>
  );
}
