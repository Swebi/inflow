import { Router } from "express";
import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/calendar.controller";
import { authMiddleware } from "../middlewares/auth";

export const calendarRouter = Router();

calendarRouter.use(authMiddleware);
calendarRouter.post("/events", createEvent);
calendarRouter.get("/events", listEvents);
calendarRouter.get("/events/:eventId", getEvent);
calendarRouter.patch("/events/:eventId", updateEvent);
calendarRouter.delete("/events/:eventId", deleteEvent);
