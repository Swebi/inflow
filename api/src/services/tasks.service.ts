import { getTasksClient } from "../utils/google";
import { handleGetValidGoogleTokens } from "./google.service";
import { handleRecordAction } from "./actions.service";
import { CreateTaskData, ListTasksData } from "../types/schema";

// All Task creation MUST go through this function — it is the single
// source of truth for the Action audit trail (used by both the manual
// save flow and, eventually, the agentic flow).
export const handleCreateTask = async (data: CreateTaskData) => {
  const { accessToken, refreshToken, expiryDate } =
    await handleGetValidGoogleTokens(data.userId);
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

  return handleRecordAction({
    id: data.existingActionId,
    userId: data.userId,
    type: "TASK",
    status: "APPROVED",
    addedBy: data.addedBy ?? "USER",
    title: data.title,
    date: data.dueDate,
    startTime: data.dueTime,
    notes: data.notes,
    externalId: response.data.id ?? undefined,
  });
};

export const handleListTasks = async (data: ListTasksData) => {
  const { accessToken, refreshToken, expiryDate } =
    await handleGetValidGoogleTokens(data.userId);
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
  const { accessToken, refreshToken, expiryDate } =
    await handleGetValidGoogleTokens(userId);
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
  const { accessToken, refreshToken, expiryDate } =
    await handleGetValidGoogleTokens(userId);
  const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

  const response = await tasksClient.tasks.patch({
    tasklist: "@default",
    task: taskId,
    requestBody: taskData,
  });

  return response.data;
};

export const handleDeleteTask = async (userId: string, taskId: string) => {
  const { accessToken, refreshToken, expiryDate } =
    await handleGetValidGoogleTokens(userId);
  const tasksClient = getTasksClient(accessToken, refreshToken, expiryDate);

  await tasksClient.tasks.delete({
    tasklist: "@default",
    task: taskId,
  });
};
