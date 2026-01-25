export interface ExtractedEvent {
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string;
}

import { Request } from "express";

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export interface CalendarEvent {
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
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
  startTime: string;
  endTime: string;
  date: string;
  description?: string;
  location?: string;
  color?: EventColorKey;
  timeZone?: string;
}

export interface CreateEventData {
  accessToken: string;
  summary: string;
  startTime: string;
  endTime: string;
  date: string;
  description?: string;
  location?: string;
  color?: EventColorKey;
  timeZone?: string;
}

export interface ListEventsData {
  accessToken: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}
