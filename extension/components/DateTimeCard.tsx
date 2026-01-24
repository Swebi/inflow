interface DateTimeCardProps {
  currentTime: Date;
  eventsCount?: number;
}

export function DateTimeCard({ currentTime, eventsCount = 0 }: DateTimeCardProps) {
  const formatMonth = () => {
    return currentTime.toLocaleDateString("en-US", { month: "long" });
  };

  const formatDate = () => {
    const day = String(currentTime.getDate()).padStart(2, "0");
    const month = String(currentTime.getMonth() + 1).padStart(2, "0");
    const year = String(currentTime.getFullYear()).slice(-2);
    // Using thin space (U+2009) for subtle spacing around separators
    return `${day}\u2009|\u2009${month}\u2009|\u2009${year}`;
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDay = () => {
    return currentTime.toLocaleDateString("en-US", { weekday: "long" });
  };

  // Get upcoming days for the row
  const getUpcomingDays = () => {
    const days = [];
    for (let i = 1; i <= 4; i++) {
      const date = new Date(currentTime);
      date.setDate(date.getDate() + i);
      days.push(date.getDate());
    }
    return days;
  };

  const timeParts = formatTime().split(" ");
  const upcomingDays = getUpcomingDays();

  return (
    <div className="px-4 mb-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        {/* Top row: Today + upcoming days */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Today
          </span>
          {upcomingDays.map((day, index) => (
            <span
              key={index}
              className="w-8 h-8 flex items-center justify-center text-sm text-slate-400 rounded-full"
            >
              {day}
            </span>
          ))}
        </div>

        {/* Middle row: Month/Date + Time */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-blue-500">{formatMonth()}</p>
            <p className="text-lg text-slate-500">{formatDate()}</p>
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
