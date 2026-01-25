import { useState } from "react";
import { EventResponse } from "./types";
import { EventCard } from "./EventCard";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";

type FilterType = "recents" | "calendar" | "tasks";

interface EventsListProps {
  events: EventResponse[];
  error: string | null;
  extracting: boolean;
  showSuccess: boolean;
}

export function EventsList({
  events,
  error,
  extracting,
  showSuccess,
}: EventsListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("recents");

  const filteredEvents =
    activeFilter === "recents"
      ? events
      : activeFilter === "calendar"
        ? events.filter((e) => e.source === "google-calendar")
        : events.filter((e) => e.source === "google-tasks");

  const filterBtn =
    "text-sm font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5";

  return (
    <div className="flex-1 px-4 pb-24">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveFilter("recents")}
          className={`${filterBtn} ${
            activeFilter === "recents"
              ? "bg-blue-100 text-slate-900"
              : "bg-slate-200/60 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Recents
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("calendar")}
          className={`${filterBtn} ${
            activeFilter === "calendar"
              ? "bg-blue-100 text-slate-900"
              : "bg-slate-200/60 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <img src={calendarIcon} alt="" className="w-4 h-4" aria-hidden />
          Calendar
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("tasks")}
          className={`${filterBtn} ${
            activeFilter === "tasks"
              ? "bg-blue-100 text-slate-900"
              : "bg-slate-200/60 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <img src={tasksIcon} alt="" className="w-4 h-4" aria-hidden />
          Tasks
        </button>
      </div>

      {/* {error && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-3">
          <p className="text-sm text-blue-700">{error}</p>
        </div>
      )} */}

      {extracting && (
        <p className="text-sm text-slate-400 mb-3">
          Extracting email from Gmail...
        </p>
      )}

      {filteredEvents.length === 0 && !extracting && (
        <p className="text-sm text-slate-400 mb-3">
          {events.length === 0
            ? "Scan an email to extract events and add them here."
            : activeFilter === "calendar"
              ? "No calendar events."
              : activeFilter === "tasks"
                ? "No tasks."
                : "Scan an email to extract events and add them here."}
        </p>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.map((event, index) => (
          <EventCard
            key={index}
            event={event}
            variant={index % 2 === 0 ? "light" : "dark"}
          />
        ))}
      </div>

      {/* Success Message */}
      {/* {showSuccess && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700 font-medium">
            Event added successfully!
          </p>
        </div>
      )} */}
    </div>
  );
}
