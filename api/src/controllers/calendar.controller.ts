import { Request, Response } from "express";
import { calendarService } from "../services/calendar.service";

export const calendarController = {
  createEvent: async (req: Request, res: Response) => {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      if (!accessToken) {
        return res.status(401).json({
          error: "Access token is required",
        });
      }

      const {
        summary,
        startTime,
        endTime,
        date,
        description,
        location,
        color,
        timeZone,
      } = req.body;

      if (!summary || !startTime || !endTime || !date) {
        return res.status(400).json({
          error: "summary, startTime, endTime, and date are required",
        });
      }

      const event = await calendarService.createEvent({
        accessToken,
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
      console.error("Error creating event:", error);
      res.status(500).json({
        error: "Failed to create calendar event",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  listEvents: async (req: Request, res: Response) => {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      if (!accessToken) {
        return res.status(401).json({
          error: "Access token is required",
        });
      }

      const { timeMin, timeMax, maxResults } = req.query;

      const events = await calendarService.listEvents({
        accessToken,
        timeMin: timeMin as string | undefined,
        timeMax: timeMax as string | undefined,
        maxResults: maxResults ? parseInt(maxResults as string) : undefined,
      });

      res.json(events);
    } catch (error) {
      console.error("Error listing events:", error);
      res.status(500).json({
        error: "Failed to list calendar events",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  getEvent: async (req: Request, res: Response) => {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      if (!accessToken) {
        return res.status(401).json({
          error: "Access token is required",
        });
      }

      const { eventId } = req.params;

      if (!eventId) {
        return res.status(400).json({
          error: "Event ID is required",
        });
      }

      const event = await calendarService.getEvent(accessToken, eventId);
      res.json(event);
    } catch (error) {
      console.error("Error getting event:", error);
      res.status(500).json({
        error: "Failed to get calendar event",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  updateEvent: async (req: Request, res: Response) => {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      if (!accessToken) {
        return res.status(401).json({
          error: "Access token is required",
        });
      }

      const { eventId } = req.params;

      if (!eventId) {
        return res.status(400).json({
          error: "Event ID is required",
        });
      }

      const event = await calendarService.updateEvent(
        accessToken,
        eventId,
        req.body
      );
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({
        error: "Failed to update calendar event",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  deleteEvent: async (req: Request, res: Response) => {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      if (!accessToken) {
        return res.status(401).json({
          error: "Access token is required",
        });
      }

      const { eventId } = req.params;

      if (!eventId) {
        return res.status(400).json({
          error: "Event ID is required",
        });
      }

      await calendarService.deleteEvent(accessToken, eventId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({
        error: "Failed to delete calendar event",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
