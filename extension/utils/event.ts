import { parse, format, addHours, subHours } from "date-fns";
import { EventFormData, EventResponse, ScannedEventResponse } from "@/types/schema";

export function parseTimeToHHmm(time: string): string {
  const [h, m] = time.split(":").map((s) => parseInt(s, 10) || 0);
  const d = new Date(2000, 0, 1, h, m, 0, 0);
  return format(d, "HH:mm");
}

export function scannedToFormData(data: ScannedEventResponse): EventFormData {
  let date: Date;
  try {
    date = parse(data.date, "dd.MM.yyyy", new Date());
  } catch {
    date = new Date();
  }

  const hasStart = data.startTime != null && data.startTime !== "";
  const hasEnd = data.endTime != null && data.endTime !== "";

  let startTime: string;
  let endTime: string;

  if (hasStart && hasEnd) {
    startTime = parseTimeToHHmm(data.startTime!);
    endTime = parseTimeToHHmm(data.endTime!);
  } else if (hasStart) {
    const [h, m] = data.startTime!.split(":").map((s) => parseInt(s, 10) || 0);
    const base = new Date(2000, 0, 1, h, m, 0, 0);
    startTime = format(base, "HH:mm");
    endTime = format(addHours(base, 1), "HH:mm");
  } else if (hasEnd) {
    const [h, m] = data.endTime!.split(":").map((s) => parseInt(s, 10) || 0);
    const base = new Date(2000, 0, 1, h, m, 0, 0);
    endTime = format(base, "HH:mm");
    startTime = format(subHours(base, 1), "HH:mm");
  } else {
    startTime = "";
    endTime = "";
  }

  const dueTime = data.startTime ?? data.endTime ?? "";
  const dueTimeStr = dueTime !== "" ? parseTimeToHHmm(dueTime) : "";

  return {
    title: data.title,
    description: data.notes ?? "",
    source: "google-calendar",
    dueDate: date,
    dueTime: dueTimeStr,
    startDate: date,
    startTime,
    endDate: date,
    endTime,
  };
}

export function formDataToEvent(data: EventFormData): EventResponse {
  if (data.source === "google-tasks") {
    return {
      title: data.title,
      date: format(data.dueDate, "dd.MM.yyyy"),
      time: data.dueTime || undefined,
      notes: data.description || undefined,
      source: "google-tasks",
    };
  }
  const hasStart = data.startTime != null && data.startTime !== "";
  const hasEnd = data.endTime != null && data.endTime !== "";
  const timeStr =
    hasStart && hasEnd ? `${data.startTime} - ${data.endTime}` : undefined;
  return {
    title: data.title,
    date: format(data.startDate, "dd.MM.yyyy"),
    time: timeStr,
    notes: data.description || undefined,
    source: "google-calendar",
  };
}
