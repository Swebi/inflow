import { prisma } from "../lib/prisma";
import { RecordActionData } from "../types/schema";

export const handleRecordAction = async (data: RecordActionData) => {
  try {
    return await prisma.action.create({
      data: {
        userId: data.userId,
        type: data.type,
        addedBy: data.addedBy,
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
