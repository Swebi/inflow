import { useState } from "react";
import { FilterType, EventsListProps } from "@/types/schema";
import { EventCard } from "./EventCard";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";
import { AlertCircle, Mail } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export function EventsList({
  events,
  error,
  extracting,
  showSuccess,
  selectedDate,
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

  const emptyDescription = () => {
    if (selectedDate && events.length === 0) {
      return "No events on this date yet.";
    }
    if (activeFilter === "calendar") return "No calendar events.";
    if (activeFilter === "tasks") return "No tasks.";
    return "Scan an email to extract events and add them here.";
  };

  return (
    <div className="flex-1 px-4 pb-24">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveFilter("recents")}
          className={`${filterBtn} ${
            activeFilter === "recents"
              ? "bg-slate-800 text-white"
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
              ? "bg-slate-800 text-white"
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
              ? "bg-slate-800 text-white"
              : "bg-slate-200/60 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <img src={tasksIcon} alt="" className="w-4 h-4" aria-hidden />
          Tasks
        </button>
      </div>

      {error && !extracting && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

      {filteredEvents.length === 0 && !extracting && (
        <Empty className="border-0 py-6">
          <EmptyHeader className="gap-0">
            <EmptyMedia variant="icon" className="size-16 rounded-full bg-slate-100 mb-2">
              <Mail className="size-8 text-slate-600" />
            </EmptyMedia>
            <EmptyTitle className="text-xl font-semibold text-slate-900 mb-2">
              No actions yet
            </EmptyTitle>
            <EmptyDescription className="text-slate-500">
              {emptyDescription()}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="space-y-3">
        {filteredEvents.map((event, index) => (
          <EventCard key={index} event={event} variant="light" />
        ))}
      </div>

      {showSuccess && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700 font-medium">
            Event added successfully!
          </p>
        </div>
      )}
    </div>
  );
}
