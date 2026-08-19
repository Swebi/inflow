import { Response, NextFunction } from "express";
import { calendarService } from "../services/calendar.service";
import { AuthRequest } from "../types/schema";

function handleGoogleError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof Error && error.message === "Google account not connected") {
    res.status(403).json({ error: "Google account not connected" });
    return;
  }
  next(error);
}

export const calendarController = {
  createEvent: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { summary, startTime, endTime, date, description, location, color, timeZone } = req.body;

      if (!summary || !startTime || !endTime || !date) {
        res.status(400).json({ error: "summary, startTime, endTime, and date are required" });
        return;
      }

      const event = await calendarService.createEvent({
        userId: req.user.userId,
        summary,
        startTime,
        endTime,
        date,
        description,
        location,
        color,
        timeZone,
      });

      res.status(201).json(event);
    } catch (error) {
      handleGoogleError(error, res, next);
    }
  },

  listEvents: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { timeMin, timeMax, maxResults } = req.query;

      const events = await calendarService.listEvents({
        userId: req.user.userId,
        timeMin: timeMin as string | undefined,
        timeMax: timeMax as string | undefined,
        maxResults: maxResults ? parseInt(maxResults as string) : undefined,
      });

      res.json(events);
    } catch (error) {
      handleGoogleError(error, res, next);
    }
  },

  getEvent: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { eventId } = req.params;
      if (!eventId) { res.status(400).json({ error: "Event ID is required" }); return; }

      const event = await calendarService.getEvent(req.user.userId, eventId);
      res.json(event);
    } catch (error) {
      handleGoogleError(error, res, next);
    }
  },

  updateEvent: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { eventId } = req.params;
      if (!eventId) { res.status(400).json({ error: "Event ID is required" }); return; }

      const event = await calendarService.updateEvent(req.user.userId, eventId, req.body);
      res.json(event);
    } catch (error) {
      handleGoogleError(error, res, next);
    }
  },

  deleteEvent: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { eventId } = req.params;
      if (!eventId) { res.status(400).json({ error: "Event ID is required" }); return; }

      await calendarService.deleteEvent(req.user.userId, eventId);
      res.status(204).send();
    } catch (error) {
      handleGoogleError(error, res, next);
    }
  },
};
