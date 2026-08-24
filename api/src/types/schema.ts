import { Request } from "express";
import { EventColorKey } from "../constants/calendar";

export interface AppError {
  statusCode: number;
  message: string;
}

export interface ExtractedEvent {
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string;
  kind?: string;
}

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export interface CalendarEvent {
  summary: string;
  start: { dateTime: string; timeZone: string } | { date: string };
  end: { dateTime: string; timeZone: string } | { date: string };
  description?: string;
  location?: string;
  colorId?: string;
  reminders: {
    useDefault: boolean;
  };
  extendedProperties: {
    private: {
      generated_by: string;
    };
  };
}

export interface GenerateEventParams {
  summary: string;
  startTime?: string;
  endTime?: string;
  date: string;
  description?: string;
  location?: string;
  color?: EventColorKey;
  timeZone?: string;
}

export interface CreateEventData {
  userId: string;
  summary: string;
  startTime?: string;
  endTime?: string;
  date: string;
  description?: string;
  location?: string;
  color?: EventColorKey;
  timeZone?: string;
  addedBy?: AddedBy;
  existingActionId?: string;
}

export interface ListEventsData {
  userId: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

export interface CreateTaskData {
  userId: string;
  title: string;
  notes?: string;
  dueDate?: string;
  dueTime?: string;
  addedBy?: AddedBy;
  existingActionId?: string;
}

export interface ListTasksData {
  userId: string;
  dueMin?: string;
  dueMax?: string;
  maxResults?: number;
}

export type ActionType = "CALENDAR_EVENT" | "TASK";
export type AddedBy = "USER" | "AGENT";
export type ActionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RecordActionData {
  id?: string;
  userId: string;
  type?: ActionType;
  status?: ActionStatus;
  kind?: string;
  threadId?: string;
  addedBy?: AddedBy;
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  externalId?: string;
}
