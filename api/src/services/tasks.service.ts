import { getTasksClient } from "../utils/google";
import { handleGetValidGoogleTokens } from "./google.service";

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

export const handleCreateTask = async (data: CreateTaskData) => {
  const { accessToken, refreshToken, expiryDate } = await handleGetValidGoogleTokens(data.userId);
  const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

  const due = data.dueDate ? `${data.dueDate}T00:00:00.000Z` : undefined;

  const response = await tasksClient.tasks.insert({
    tasklist: "@default",
    requestBody: {
      title: data.title,
      notes: data.notes,
      due,
    },
  });

  return response.data;
};

export const handleListTasks = async (data: ListTasksData) => {
  const { accessToken, refreshToken, expiryDate } = await handleGetValidGoogleTokens(data.userId);
  const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

  const response = await tasksClient.tasks.list({
    tasklist: "@default",
    dueMin: data.dueMin,
    dueMax: data.dueMax,
    maxResults: data.maxResults || 20,
  });

  return response.data.items || [];
};

export const handleGetTask = async (userId: string, taskId: string) => {
  const { accessToken, refreshToken, expiryDate } = await handleGetValidGoogleTokens(userId);
  const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

  const response = await tasksClient.tasks.get({
    tasklist: "@default",
    task: taskId,
  });

  return response.data;
};

export const handleUpdateTask = async (
  userId: string,
  taskId: string,
  taskData: { title?: string; notes?: string; due?: string; status?: string }
) => {
  const { accessToken, refreshToken, expiryDate } = await handleGetValidGoogleTokens(userId);
  const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

  const response = await tasksClient.tasks.patch({
    tasklist: "@default",
    task: taskId,
    requestBody: taskData,
  });

  return response.data;
};

export const handleDeleteTask = async (userId: string, taskId: string) => {
  const { accessToken, refreshToken, expiryDate } = await handleGetValidGoogleTokens(userId);
  const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

  await tasksClient.tasks.delete({
    tasklist: "@default",
    task: taskId,
  });
};
