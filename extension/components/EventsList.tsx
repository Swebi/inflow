import { useEffect, useRef, useState } from "react";
import { FilterType, EventsListProps } from "@/types/schema";
import { EventCard } from "./EventCard";
import { AlertCircle, Mail } from "lucide-react";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";
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

  // Tab labels are navigation chrome, so they sit in the mono face like every
  // other label in the panel. Selected = a neutral slate fill, not accent —
  // accent is reserved for "this needs you", and a resolved-history filter
  // isn't that.
  const tab =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11.5px] font-medium tracking-[0.01em] transition-colors";
  const tabActive = "bg-slate-900 text-white";
  const tabIdle = "text-slate-500 hover:bg-slate-100";

  const emptyDescription = () => {
    if (selectedDate && events.length === 0) {
      return "No events on this date yet.";
    }
    if (activeFilter === "calendar") return "No calendar events.";
    if (activeFilter === "tasks") return "No tasks.";
    return "Scan an email to extract events and add them here.";
  };

  const isEmpty = filteredEvents.length === 0 && !extracting;

  // The scroll container (our parentElement, owned by Dashboard) has no
  // reason to be scrollable when there's nothing but the empty state to
  // show — toggle its overflow off in that case so it can never be dragged
  // into blank space below "No actions yet". This only runs when isEmpty
  // flips, not on every layout, so it can't jitter mid-scroll the way a
  // continuous resize measurement would.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scrollRoot = rootRef.current?.parentElement;
    if (!scrollRoot) return;
    scrollRoot.style.overflowY = isEmpty ? "hidden" : "";
  }, [isEmpty]);

  // The FAB floats absolute over the scroll container, so it needs ~96px of
  // bottom clearance to keep the last card from sitting under it.
  const clearance = isEmpty ? "min-h-full pb-6" : "min-h-full pb-24";

  return (
    <div ref={rootRef} className={`box-border px-gutter ${clearance}`}>
      <div className="sticky top-0 z-10 -mx-gutter mb-2 flex items-center gap-1 bg-slate-100 px-gutter pb-2 pt-2">
        <button
          type="button"
          onClick={() => setActiveFilter("recents")}
          className={`${tab} ${
            activeFilter === "recents" ? tabActive : tabIdle
          }`}
        >
          Recents
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("calendar")}
          className={`${tab} ${
            activeFilter === "calendar" ? tabActive : tabIdle
          }`}
        >
          <img src={calendarIcon} alt="" className="size-3.5" aria-hidden />
          Calendar
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("tasks")}
          className={`${tab} ${activeFilter === "tasks" ? tabActive : tabIdle}`}
        >
          <img src={tasksIcon} alt="" className="size-3.5" aria-hidden />
          Tasks
        </button>
      </div>

      {error && !extracting && (
        <div className="mb-3 flex items-start gap-2 px-1 py-2">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <p className="text-[12px] leading-relaxed text-slate-500">{error}</p>
        </div>
      )}

      {isEmpty && (
        <Empty className="flex-none justify-start gap-0 border-0 p-0 pb-16">
          <EmptyHeader className="gap-0">
            <EmptyMedia
              variant="icon"
              className="mb-0 size-10 rounded-full bg-slate-100"
            >
              <Mail className="size-5 text-slate-500" />
            </EmptyMedia>
            <EmptyTitle className="type-title mb-1">No actions yet</EmptyTitle>
            <EmptyDescription className="type-body max-w-60 text-[12px] leading-snug">
              {emptyDescription()}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="space-y-stack">
        {filteredEvents.map((event, index) => (
          <EventCard key={event.id ?? index} event={event} variant="light" />
        ))}
      </div>

      {showSuccess && (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
          <p className="text-[12px] font-medium text-green-700">Event added</p>
        </div>
      )}
    </div>
  );
}
