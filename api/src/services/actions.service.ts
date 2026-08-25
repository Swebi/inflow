import { prisma } from "../lib/prisma";
import { RecordActionData } from "../types/schema";
import { resumeAction } from "../agents/email/runner";

export const handleRecordAction = async (data: RecordActionData) => {
  try {
    if (data.id) {
      return await prisma.action.update({
        where: { id: data.id },
        data: {
          type: data.type,
          status: data.status,
          kind: data.kind,
          threadId: data.threadId,
          addedBy: data.addedBy,
          title: data.title,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes,
          externalId: data.externalId,
        },
      });
    }

    if (!data.title) {
      throw new Error("title is required to create an Action");
    }

    return await prisma.action.create({
      data: {
        userId: data.userId,
        type: data.type,
        status: data.status,
        kind: data.kind,
        threadId: data.threadId,
        addedBy: data.addedBy ?? "USER",
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
        externalId: data.externalId,
      },
    });
  } catch (error) {
    console.error("Failed to record action", {
      userId: data.userId,
      type: data.type,
      externalId: data.externalId,
      error,
    });
    return null;
  }
};

export const handleListRecentActions = async (userId: string, limit = 20) => {
  return prisma.action.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

export const handleResumeAction = async (
  userId: string,
  actionId: string,
  decision: {
    approved: boolean;
    destination?: "CALENDAR_EVENT" | "TASK";
    overrides?: Record<string, unknown>;
  }
) => {
  const action = await prisma.action.findFirst({
    where: { id: actionId, userId, status: "PENDING" },
  });

  if (!action || !action.threadId) {
    throw { statusCode: 404, message: "Pending action not found" };
  }

  return resumeAction(action.threadId, decision);
};
