export interface EventResponse {
  title: string;
  date: string;
  time?: string;
  notes?: string;
  source: "google-calendar" | "google-tasks";
}
