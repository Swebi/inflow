import { EventResponse } from "./types";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";

interface EventCardProps {
  event: EventResponse;
  variant: "light" | "dark";
}

export function EventCard({ event, variant }: EventCardProps) {
  const isLight = variant === "light";
  const sourceIcon = event.source === "google-calendar" ? calendarIcon : tasksIcon;

  return (
    <div
      className={`rounded-2xl p-4 ${
        isLight ? "bg-blue-100 border border-blue-200" : "bg-blue-500"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3
            className={`font-semibold text-base ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            {event.title}
          </h3>
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
                {event.time}
              </p>
            )}
          </div>
        </div>
        <div className="ml-3 shrink-0">
          <img
            src={sourceIcon}
            alt={event.source === "google-calendar" ? "Google Calendar" : "Google Tasks"}
            className="w-5 h-5"
          />
        </div>
      </div>
    </div>
  );
}
