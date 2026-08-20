import { Router } from "express";
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
} from "../controllers/tasks.controller";
import { authMiddleware } from "../middlewares/auth";

export const tasksRouter = Router();

tasksRouter.use(authMiddleware);
tasksRouter.post("/tasks", createTask);
tasksRouter.get("/tasks", listTasks);
tasksRouter.get("/tasks/:taskId", getTask);
tasksRouter.patch("/tasks/:taskId", updateTask);
tasksRouter.delete("/tasks/:taskId", deleteTask);
