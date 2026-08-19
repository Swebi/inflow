import { Router } from "express";
import { tasksController } from "../controllers/tasks.controller";
import { authMiddleware } from "../middlewares/auth";

export const tasksRouter = Router();

tasksRouter.use(authMiddleware);
tasksRouter.post("/tasks", tasksController.createTask);
tasksRouter.get("/tasks", tasksController.listTasks);
tasksRouter.get("/tasks/:taskId", tasksController.getTask);
tasksRouter.patch("/tasks/:taskId", tasksController.updateTask);
tasksRouter.delete("/tasks/:taskId", tasksController.deleteTask);
