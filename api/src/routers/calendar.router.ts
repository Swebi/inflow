import { Router } from "express";
import { calendarController } from "../controllers/calendar.controller";
import { authMiddleware } from "../middlewares/auth";

export const calendarRouter = Router();

calendarRouter.use(authMiddleware);
calendarRouter.post("/events", calendarController.createEvent);
calendarRouter.get("/events", calendarController.listEvents);
calendarRouter.get("/events/:eventId", calendarController.getEvent);
calendarRouter.patch("/events/:eventId", calendarController.updateEvent);
calendarRouter.delete("/events/:eventId", calendarController.deleteEvent);
