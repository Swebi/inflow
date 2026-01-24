import { getCalendarClient } from "../utils/google";
import { generateEvent } from "../utils/calendar";
import { CalendarEvent, CreateEventData, ListEventsData } from "../types/schema";

export const calendarService = {
  createEvent: async (data: CreateEventData) => {
    const calendarClient = getCalendarClient(data.accessToken);

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

    return response.data;
  },

  listEvents: async (data: ListEventsData) => {
    const calendarClient = getCalendarClient(data.accessToken);

    const response = await calendarClient.events.list({
      calendarId: "primary",
      timeMin: data.timeMin,
      timeMax: data.timeMax,
      maxResults: data.maxResults || 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  },

  getEvent: async (accessToken: string, eventId: string) => {
    const calendarClient = getCalendarClient(accessToken);

    const response = await calendarClient.events.get({
      calendarId: "primary",
      eventId,
    });

    return response.data;
  },

  updateEvent: async (
    accessToken: string,
    eventId: string,
    eventData: Partial<CalendarEvent>
  ) => {
    const calendarClient = getCalendarClient(accessToken);

    const response = await calendarClient.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: eventData,
    });

    return response.data;
  },

  deleteEvent: async (accessToken: string, eventId: string) => {
    const calendarClient = getCalendarClient(accessToken);

    await calendarClient.events.delete({
      calendarId: "primary",
      eventId,
    });
  },
};
