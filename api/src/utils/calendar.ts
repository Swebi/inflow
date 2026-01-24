import {
  EVENT_COLORS,
  DEFAULT_TIMEZONE,
  APP_IDENTIFIER,
} from "../constants/calendar";
import { CalendarEvent, GenerateEventParams } from "../types/schema";

export function createEventDateTime(
  time: string,
  date: string,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  return `${date}T${time}:00`;
}

export function generateEvent(params: GenerateEventParams): CalendarEvent {
  const {
    summary,
    startTime,
    endTime,
    date,
    description,
    location,
    color,
    timeZone = DEFAULT_TIMEZONE,
  } = params;

  const start = createEventDateTime(startTime, date, timeZone);
  const end = createEventDateTime(endTime, date, timeZone);

  const event: CalendarEvent = {
    summary,
    start: {
      dateTime: start,
      timeZone,
    },
    end: {
      dateTime: end,
      timeZone,
    },
    reminders: {
      useDefault: false,
    },
    extendedProperties: {
      private: {
        generated_by: APP_IDENTIFIER,
      },
    },
  };

  if (description) {
    event.description = description;
  }

  if (location) {
    event.location = location;
  }

  if (color && EVENT_COLORS[color]) {
    event.colorId = EVENT_COLORS[color];
  }

  return event;
}

export function getDayBounds(date: string): {
  startOfDay: string;
  endOfDay: string;
} {
  return {
    startOfDay: `${date}T00:00:00.000Z`,
    endOfDay: `${date}T23:59:59.999Z`,
  };
}
