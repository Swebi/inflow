import { Response, NextFunction } from "express";
import {
  handleCreateEvent,
  handleListEvents,
  handleGetEvent,
  handleUpdateEvent,
  handleDeleteEvent,
} from "../services/calendar.service";
import { AuthRequest, AppError } from "../types/schema";

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { summary, startTime, endTime, date, description, location, color, timeZone } = req.body;

    if (!summary || !date) {
      throw { statusCode: 400, message: "summary and date are required" } as AppError;
    }

    if ((startTime && !endTime) || (endTime && !startTime)) {
      throw { statusCode: 400, message: "startTime and endTime must be provided together" } as AppError;
    }

    const action = await handleCreateEvent({
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

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: action,
    });
  } catch (error) {
    next(error);
  }
};

export const listEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { timeMin, timeMax, maxResults } = req.query;

    const data = await handleListEvents({
      userId: req.user.userId,
      timeMin: timeMin as string | undefined,
      timeMax: timeMax as string | undefined,
      maxResults: maxResults ? parseInt(maxResults as string) : undefined,
    });

    res.status(200).json({
      success: true,
      message: "Events fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { eventId } = req.params;
    if (!eventId) {
      throw { statusCode: 400, message: "Event ID is required" } as AppError;
    }

    const data = await handleGetEvent(req.user.userId, eventId);

    res.status(200).json({
      success: true,
      message: "Event fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { eventId } = req.params;
    if (!eventId) {
      throw { statusCode: 400, message: "Event ID is required" } as AppError;
    }

    await handleUpdateEvent(req.user.userId, eventId, req.body);

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { eventId } = req.params;
    if (!eventId) {
      throw { statusCode: 400, message: "Event ID is required" } as AppError;
    }

    await handleDeleteEvent(req.user.userId, eventId);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
