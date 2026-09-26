import { prisma } from "../lib/prisma";
import { handleListNewMessages, MessageNotFoundError } from "./gmail.service";
import {
  isInvalidGrantError,
  handleClearRevokedGoogleTokens,
} from "./google.service";
import { runEmailAgent } from "../agents/email/runner";
import { emailQueue } from "../bull/queues";

export const handleScanUser = async (userId: string) => {
  let messageIds: string[];
  try {
    messageIds = await handleListNewMessages(userId);
  } catch (error) {
    if (isInvalidGrantError(error)) {
      await handleClearRevokedGoogleTokens(userId);
      console.warn(
        `[agent-scan] user ${userId}: Google access revoked, skipping until reconnect`
      );
      return [];
    }
    throw error;
  }
  console.log(
    `[agent-scan] user ${userId}: ${messageIds.length} new message(s), queueing`
  );

  for (const messageId of messageIds) {
    await emailQueue.add(
      "process-email",
      { userId, messageId },
      { jobId: `${userId}_${messageId}` }
    );
  }

  return messageIds;
};

export const handleScanAllUsers = async () => {
  const users = await prisma.user.findMany({
    where: { googleRefreshToken: { not: null } },
    select: { id: true },
  });

  const results: { userId: string; messageIds: string[] }[] = [];
  for (const user of users) {
    const messageIds = await handleScanUser(user.id);
    results.push({ userId: user.id, messageIds });
  }

  return results;
};

export const handleProcessEmail = async (userId: string, messageId: string) => {
  try {
    await runEmailAgent(userId, messageId);
    return { userId, messageId, ok: true };
  } catch (error) {
    if (error instanceof MessageNotFoundError) {
      // Expected: message was deleted/moved between listing and fetching.
      console.warn(
        `[agent-process] user ${userId}: message ${messageId} no longer exists, skipping`
      );
      return { userId, messageId, ok: false };
    }
    console.error("Agent run failed", { userId, messageId, error });
    throw error;
  }
};
