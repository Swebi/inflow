import { DateTimeCardProps } from "@/types/schema";

export function DateTimeCard({
  currentTime,
  eventsCount = 0,
  selectedDate,
  onDateChange,
}: DateTimeCardProps) {
  // Use selectedDate if provided, otherwise use currentTime
  const displayDate = selectedDate || currentTime;
  const isToday = displayDate.toDateString() === currentTime.toDateString();

  const formatDate = () => {
    // Format: "Jan 25 2026" (no comma)
    const month = displayDate.toLocaleDateString("en-US", { month: "short" });
    const day = displayDate.getDate();
    const year = displayDate.getFullYear();
    return `${month} ${day} ${year}`;
  };

  const formatTime = () => {
    return displayDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDay = () => {
    return displayDate.toLocaleDateString("en-US", { weekday: "long" });
  };

  // Get upcoming days with full date objects for navigation
  const getUpcomingDays = () => {
    const days = [];
    for (let i = 1; i <= 4; i++) {
      const date = new Date(currentTime);
      date.setDate(date.getDate() + i);
      days.push({
        day: date.getDate(),
        date: date,
      });
    }
    return days;
  };

  const handleDateClick = (date: Date) => {
    onDateChange?.(date);
  };

  const handleTodayClick = () => {
    onDateChange?.(currentTime);
  };

  const timeParts = formatTime().split(" ");
  const upcomingDays = getUpcomingDays();

  return (
    <div className="px-4 mb-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        {/* Top row: Today + upcoming days */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleTodayClick}
            className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
              isToday
                ? "bg-slate-800 text-white"
                : "bg-slate-200/60 text-slate-600 hover:bg-slate-200"
            }`}
            aria-label="Go to today"
          >
            Today
          </button>
          {upcomingDays.map((dayObj, index) => {
            const isSelected =
              selectedDate &&
              dayObj.date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={index}
                onClick={() => handleDateClick(dayObj.date)}
                className={`w-8 h-8 flex items-center justify-center text-sm rounded-full transition-colors ${
                  isSelected
                    ? "bg-slate-800 text-white"
                    : "bg-slate-200/60 text-slate-600 hover:bg-slate-200"
                }`}
                aria-label={`Go to ${dayObj.date.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}`}
              >
                {dayObj.day}
              </button>
            );
          })}
        </div>

        {/* Middle row: Date + Time */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-slate-900">{formatDate()}</p>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <p className="text-4xl font-bold text-slate-900">
              {timeParts[0]}
              <span className="text-base font-normal text-slate-400 ml-1">
                {timeParts[1]}
              </span>
            </p>
          </div>
        </div>

        {/* Bottom row: Day + Events count */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-slate-800">{formatDay()}</p>
          <p className="text-sm text-slate-400">
            {eventsCount} {eventsCount === 1 ? "event" : "events"}
          </p>
        </div>
      </div>
    </div>
  );
}
