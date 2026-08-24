import { prisma } from "../lib/prisma";
import { getGmailClient } from "../utils/google";
import { handleGetValidGoogleTokens } from "./google.service";

function decodeBody(payload: any): string {
  if (!payload) return "";

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  const parts = payload.parts ?? [];
  const textPart =
    parts.find((p: any) => p.mimeType === "text/plain") ??
    parts.find((p: any) => p.mimeType === "text/html");

  if (textPart) return decodeBody(textPart);

  for (const part of parts) {
    const nested = decodeBody(part);
    if (nested) return nested;
  }

  return "";
}

export const handleListNewMessages = async (userId: string) => {
  const { accessToken, refreshToken, expiryDate } =
    await handleGetValidGoogleTokens(userId);
  const gmailClient = getGmailClient(accessToken, refreshToken, expiryDate);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastGmailHistoryId: true },
  });

  let messageIds: string[] = [];
  let newHistoryId: string | undefined;

  if (user?.lastGmailHistoryId) {
    try {
      const history = await gmailClient.users.history.list({
        userId: "me",
        startHistoryId: user.lastGmailHistoryId,
        historyTypes: ["messageAdded"],
      });

      const added =
        history.data.history?.flatMap((h) => h.messagesAdded ?? []) ?? [];
      messageIds = [
        ...new Set(
          added.map((m) => m.message?.id).filter((id): id is string => !!id)
        ),
      ];
      newHistoryId = history.data.historyId ?? undefined;
    } catch (error: any) {
      // 404 means the historyId is too old/expired — fall back to a fresh list
      if (error?.code !== 404) throw error;
    }
  }

  if (!newHistoryId) {
    const list = await gmailClient.users.messages.list({
      userId: "me",
      maxResults: 20,
    });
    messageIds = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);

    const profile = await gmailClient.users.getProfile({ userId: "me" });
    newHistoryId = profile.data.historyId ?? undefined;
  }

  if (newHistoryId) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastGmailHistoryId: newHistoryId },
    });
  }

  return messageIds;
};

export const handleGetMessage = async (userId: string, messageId: string) => {
  const { accessToken, refreshToken, expiryDate } =
    await handleGetValidGoogleTokens(userId);
  const gmailClient = getGmailClient(accessToken, refreshToken, expiryDate);

  const response = await gmailClient.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  return decodeBody(response.data.payload);
};
