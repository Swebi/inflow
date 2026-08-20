import { Response, NextFunction } from "express";
import {
  handleCreateTask,
  handleListTasks,
  handleGetTask,
  handleUpdateTask,
  handleDeleteTask,
} from "../services/tasks.service";
import { AuthRequest, AppError } from "../types/schema";

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { title, notes, dueDate, dueTime } = req.body;
    if (!title) {
      throw { statusCode: 400, message: "title is required" } as AppError;
    }

    await handleCreateTask({
      userId: req.user.userId,
      title,
      notes,
      dueDate,
      dueTime,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const listTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { dueMin, dueMax, maxResults } = req.query;

    const data = await handleListTasks({
      userId: req.user.userId,
      dueMin: dueMin as string | undefined,
      dueMax: dueMax as string | undefined,
      maxResults: maxResults ? parseInt(maxResults as string) : undefined,
    });

    res.status(200).json({
      success: true,
      message: "Tasks fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { taskId } = req.params;
    if (!taskId) {
      throw { statusCode: 400, message: "Task ID is required" } as AppError;
    }

    const data = await handleGetTask(req.user.userId, taskId);

    res.status(200).json({
      success: true,
      message: "Task fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { taskId } = req.params;
    if (!taskId) {
      throw { statusCode: 400, message: "Task ID is required" } as AppError;
    }

    await handleUpdateTask(req.user.userId, taskId, req.body);

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { taskId } = req.params;
    if (!taskId) {
      throw { statusCode: 400, message: "Task ID is required" } as AppError;
    }

    await handleDeleteTask(req.user.userId, taskId);

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
