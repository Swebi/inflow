export type EventSource = "google-calendar" | "google-tasks";

export interface EventResponse {
  title: string;
  date: string;
  time?: string;
  notes?: string;
  source: EventSource;
}

/** API response from /api/email/process – single extracted event */
export interface ScannedEventResponse {
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string;
  kind?: "registration_deadline" | "event" | "deadline" | "other";
}

/** API response shape: { success, message, data: { events: ScannedEventResponse[] } } */
export interface ProcessEmailResponse {
  success: boolean;
  message: string;
  data: {
    events: ScannedEventResponse[];
  };
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

// Component prop types
export type DrawerScreen = "picker" | "form";

export interface EventEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Parsed actions from email – drawer shows picker (2+) or form (1) */
  initialEvents: ScannedEventResponse[] | null;
  onSave: (event: EventResponse) => void;
}

export interface EventCardProps {
  event: EventResponse;
  variant: "light" | "dark";
}

export type FilterType = "recents" | "calendar" | "tasks";

export interface EventsListProps {
  events: EventResponse[];
  error: string | null;
  extracting: boolean;
  showSuccess: boolean;
  selectedDate?: Date;
}

export interface DateTimeCardProps {
  currentTime: Date;
  eventsCount?: number;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export interface FloatingActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}

export interface HeaderProps {
  greeting: string;
  userName?: string;
  onLogout?: () => void;
}
