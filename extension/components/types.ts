export type EventSource = "google-calendar" | "google-tasks";

export interface EventResponse {
  title: string;
  date: string;
  time?: string;
  notes?: string;
  source: EventSource;
}

/** API response from /api/email/process */
export interface ScannedEventResponse {
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string;
}

/** Form data for the edit-event drawer */
export interface EventFormData {
  title: string;
  description: string;
  source: EventSource;
  /** Tasks: due date and time */
  dueDate: Date;
  dueTime: string;
  /** Calendar: start */
  startDate: Date;
  startTime: string;
  /** Calendar: end */
  endDate: Date;
  endTime: string;
}
