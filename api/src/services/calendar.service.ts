import { getCalendarClient } from "../utils/google";
import { generateEvent } from "../utils/calendar";
import { CalendarEvent, CreateEventData, ListEventsData } from "../types/schema";
import { handleGetValidGoogleTokens } from "./google.service";
import { handleRecordAction } from "./actions.service";

// All Calendar-event creation MUST go through this function — it is the
// single source of truth for the Action audit trail (used by both the
// manual save flow and, eventually, the agentic flow).
export const handleCreateEvent = async (data: CreateEventData) => {
  const { accessToken, refreshToken, expiryDate } = await handleGetValidGoogleTokens(data.userId);
  const calendarClient = getCalendarClient(accessToken, refreshToken, expiryDate);

  const event = generateEvent({
    summary: data.summary,
    startTime: data.startTime,
    endTime: data.endTime,
    date: data.date,
    description: data.description,
    location: data.location,
    color: data.color,
    timeZone: data.timeZone,
  });

  const response = await calendarClient.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  return handleRecordAction({
    userId: data.userId,
    type: "CALENDAR_EVENT",
    addedBy: "USER",
    title: data.summary,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    notes: data.description,
    externalId: response.data.id ?? undefined,
  });
};

export const handleListEvents = async (data: ListEventsData) => {
  const { accessToken, refreshToken, expiryDate } = await handleGetValidGoogleTokens(data.userId);
  const calendarClient = getCalendarClient(accessToken, refreshToken, expiryDate);

  const response = await calendarClient.events.list({
    calendarId: "primary",
    timeMin: data.timeMin,
    timeMax: data.timeMax,
    maxResults: data.maxResults || 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
};

export const handleGetEvent = async (userId: string, eventId: string) => {
  const { accessToken, refreshToken, expiryDate } = await handleGetValidGoogleTokens(userId);
  const calendarClient = getCalendarClient(accessToken, refreshToken, expiryDate);

  const response = await calendarClient.events.get({
    calendarId: "primary",
    eventId,
  });

  return response.data;
};

export const handleUpdateEvent = async (
  userId: string,
  eventId: string,
  eventData: Partial<CalendarEvent>
) => {
  const { accessToken, refreshToken, expiryDate } = await handleGetValidGoogleTokens(userId);
  const calendarClient = getCalendarClient(accessToken, refreshToken, expiryDate);

  const response = await calendarClient.events.patch({
    calendarId: "primary",
    eventId,
    requestBody: eventData,
  });

  return response.data;
};

export const handleDeleteEvent = async (userId: string, eventId: string) => {
  const { accessToken, refreshToken, expiryDate } = await handleGetValidGoogleTokens(userId);
  const calendarClient = getCalendarClient(accessToken, refreshToken, expiryDate);

  await calendarClient.events.delete({
    calendarId: "primary",
    eventId,
  });
};
