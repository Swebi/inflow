import { getTasksClient } from "../utils/google";
import { googleService } from "./google.service";

export interface CreateTaskData {
  userId: string;
  title: string;
  notes?: string;
  dueDate?: string;
  dueTime?: string;
}

export interface ListTasksData {
  userId: string;
  dueMin?: string;
  dueMax?: string;
  maxResults?: number;
}

export const tasksService = {
  createTask: async (data: CreateTaskData) => {
    const { accessToken, refreshToken, expiryDate } =
      await googleService.getValidTokens(data.userId);
    const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

    const due = data.dueDate
      ? `${data.dueDate}T00:00:00.000Z`
      : undefined;

    const response = await tasksClient.tasks.insert({
      tasklist: "@default",
      requestBody: {
        title: data.title,
        notes: data.notes,
        due,
      },
    });

    return response.data;
  },

  listTasks: async (data: ListTasksData) => {
    const { accessToken, refreshToken, expiryDate } =
      await googleService.getValidTokens(data.userId);
    const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

    const response = await tasksClient.tasks.list({
      tasklist: "@default",
      dueMin: data.dueMin,
      dueMax: data.dueMax,
      maxResults: data.maxResults || 20,
    });

    return response.data.items || [];
  },

  getTask: async (userId: string, taskId: string) => {
    const { accessToken, refreshToken, expiryDate } =
      await googleService.getValidTokens(userId);
    const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

    const response = await tasksClient.tasks.get({
      tasklist: "@default",
      task: taskId,
    });

    return response.data;
  },

  updateTask: async (
    userId: string,
    taskId: string,
    taskData: { title?: string; notes?: string; due?: string; status?: string }
  ) => {
    const { accessToken, refreshToken, expiryDate } =
      await googleService.getValidTokens(userId);
    const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

    const response = await tasksClient.tasks.patch({
      tasklist: "@default",
      task: taskId,
      requestBody: taskData,
    });

    return response.data;
  },

  deleteTask: async (userId: string, taskId: string) => {
    const { accessToken, refreshToken, expiryDate } =
      await googleService.getValidTokens(userId);
    const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

    await tasksClient.tasks.delete({
      tasklist: "@default",
      task: taskId,
    });
  },
};
