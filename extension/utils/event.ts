import { parse, format, addHours, subHours, isValid } from "date-fns";
import { EventResponse, RecentActionResponse, ScannedEventResponse } from "@/types/schema";

/**
 * One human date format for every surface: "Sep 24", or "Sep 24, 2027" when the
 * year isn't the current one. Tolerates the two stored shapes we get from the
 * API ("yyyy-MM-dd") and from scanned events ("dd.MM.yyyy").
 */
export function formatHumanDate(raw?: string | null): string {
  if (!raw) return "No date";
  for (const pattern of ["yyyy-MM-dd", "dd.MM.yyyy"]) {
    const parsed = parse(raw, pattern, new Date());
    if (isValid(parsed)) {
      const sameYear = parsed.getFullYear() === new Date().getFullYear();
      return format(parsed, sameYear ? "MMM d" : "MMM d, yyyy");
    }
  }
  return raw;
}

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

/**
 * A badge's category label. Raw `kind` values from extraction are all over
 * the place ("event", "registration_deadline", "food delivery") — in a list
 * that scans 15-20+ rows the badge only works if the vocabulary is small and
 * every label is one short word. Map the known kinds to that vocabulary;
 * fall back to the first token so an unknown kind still stays one word.
 */
const KIND_LABELS: Record<string, string> = {
  login: "Login",
  signin: "Login",
  sign_in: "Login",
  verification: "Login",
  verify: "Login",
  otp: "Login",
  "2fa": "Login",
  password_reset: "Login",
  security_alert: "Login",
  account: "Login",

  deadline: "Deadline",
  registration_deadline: "Deadline",
  submission_deadline: "Deadline",
  application_deadline: "Deadline",
  payment_deadline: "Deadline",
  due: "Deadline",
  due_date: "Deadline",
  expiry: "Deadline",
  expiration: "Deadline",

  event: "Event",
  meeting: "Event",
  webinar: "Event",
  appointment: "Event",
  call: "Event",
  conference: "Event",
  invite: "Event",
  invitation: "Event",

  promo: "Promo",
  promotion: "Promo",
  sale: "Promo",
  offer: "Promo",
  discount: "Promo",
  deal: "Promo",
  marketing: "Promo",
  newsletter: "Promo",

  delivery: "Delivery",
  shipment: "Delivery",
  shipping: "Delivery",
  order: "Delivery",
  dispatch: "Delivery",

  release: "Release",
  launch: "Release",
  announcement: "Release",

  reminder: "Reminder",

  bill: "Bill",
  invoice: "Bill",
  payment: "Bill",
  receipt: "Bill",
  subscription: "Bill",

  travel: "Travel",
  flight: "Travel",
  booking: "Travel",
  reservation: "Travel",
  itinerary: "Travel",
  checkin: "Travel",
  check_in: "Travel",
};

export function kindLabel(kind?: string | null): string {
  if (!kind) return "";
  const key = kind.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (KIND_LABELS[key]) return KIND_LABELS[key];
  const first = key.split("_").filter(Boolean)[0] ?? "";
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "";
}

export function actionToEvent(action: RecentActionResponse): EventResponse {
  let date = "No due date";
  if (action.date) {
    try {
      date = format(parse(action.date, "yyyy-MM-dd", new Date()), "dd.MM.yyyy");
    } catch {
      date = action.date;
    }
  }

  const time =
    action.startTime && action.endTime
      ? `${action.startTime} - ${action.endTime}`
      : action.startTime ?? undefined;

  return {
    id: action.id,
    title: action.title,
    date,
    time,
    notes: action.notes ?? undefined,
    kind: action.kind ?? undefined,
    source: action.type === "TASK" ? "google-tasks" : "google-calendar",
  };
}
