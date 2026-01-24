import { Router } from "express";
import { calendarController } from "../controllers/calendar.controller";

export const calendarRouter = Router();

calendarRouter.post("/events", calendarController.createEvent);
calendarRouter.get("/events", calendarController.listEvents);
calendarRouter.get("/events/:eventId", calendarController.getEvent);
calendarRouter.patch("/events/:eventId", calendarController.updateEvent);
calendarRouter.delete("/events/:eventId", calendarController.deleteEvent);
