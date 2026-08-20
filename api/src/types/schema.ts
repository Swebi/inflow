export interface AppError {
  statusCode: number;
  message: string;
}

export type ExtractedEventKind =
  | "registration_deadline"
  | "event"
  | "deadline"
  | "other";

export interface ExtractedEvent {
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string;
  kind?: ExtractedEventKind;
}

import { Request } from "express";

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

import { EventColorKey } from "../constants/calendar";

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
}

export interface ListEventsData {
  userId: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

export type ActionType = "CALENDAR_EVENT" | "TASK";
export type AddedBy = "USER" | "AGENT";

export interface RecordActionData {
  userId: string;
  type: ActionType;
  addedBy: AddedBy;
  title: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  externalId?: string;
}
