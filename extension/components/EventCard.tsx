import { EventResponse } from "./types";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";

interface EventCardProps {
  event: EventResponse;
  variant: "light" | "dark";
}

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
  const sourceIcon =
    event.source === "google-calendar" ? calendarIcon : tasksIcon;

  return (
    <div
      className={`rounded-2xl p-4 ${
        isLight ? "bg-blue-100 border border-blue-200" : "bg-blue-500"
      }`}
    >
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`font-semibold text-base flex-1 ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            {event.title}
          </h3>
          <div className="shrink-0">
            <img
              src={sourceIcon}
              alt={
                event.source === "google-calendar"
                  ? "Google Calendar"
                  : "Google Tasks"
              }
              className="w-5 h-5"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p
            className={`text-sm ${
              isLight ? "text-slate-600" : "text-blue-100"
            }`}
          >
            {event.date}
          </p>
          {event.time && (
            <p
              className={`text-sm ${
                isLight ? "text-slate-600" : "text-blue-100"
              }`}
            >
              {formatTimeDisplay(event.time)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
