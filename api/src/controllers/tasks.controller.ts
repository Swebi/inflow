import { Response, NextFunction } from "express";
import { tasksService } from "../services/tasks.service";
import { AuthRequest } from "../types/schema";

function handleGoogleError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof Error && error.message === "Google account not connected") {
    res.status(403).json({ error: "Google account not connected" });
    return;
  }
  next(error);
}

export const tasksController = {
  createTask: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { title, notes, dueDate, dueTime } = req.body;
      if (!title) { res.status(400).json({ error: "title is required" }); return; }

      const task = await tasksService.createTask({
        userId: req.user.userId,
        title,
        notes,
        dueDate,
        dueTime,
      });

      res.status(201).json(task);
    } catch (error) {
      handleGoogleError(error, res, next);
    }
  },

  listTasks: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { dueMin, dueMax, maxResults } = req.query;

      const tasks = await tasksService.listTasks({
        userId: req.user.userId,
        dueMin: dueMin as string | undefined,
        dueMax: dueMax as string | undefined,
        maxResults: maxResults ? parseInt(maxResults as string) : undefined,
      });

      res.json(tasks);
    } catch (error) {
      handleGoogleError(error, res, next);
    }
  },

  getTask: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { taskId } = req.params;
      if (!taskId) { res.status(400).json({ error: "Task ID is required" }); return; }

      const task = await tasksService.getTask(req.user.userId, taskId);
      res.json(task);
    } catch (error) {
      handleGoogleError(error, res, next);
    }
  },

  updateTask: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { taskId } = req.params;
      if (!taskId) { res.status(400).json({ error: "Task ID is required" }); return; }

      const task = await tasksService.updateTask(req.user.userId, taskId, req.body);
      res.json(task);
    } catch (error) {
      handleGoogleError(error, res, next);
    }
  },

  deleteTask: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const { taskId } = req.params;
      if (!taskId) { res.status(400).json({ error: "Task ID is required" }); return; }

      await tasksService.deleteTask(req.user.userId, taskId);
      res.status(204).send();
    } catch (error) {
      handleGoogleError(error, res, next);
    }
  },
};
