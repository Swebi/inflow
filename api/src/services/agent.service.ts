import { prisma } from "../lib/prisma";
import { handleListNewMessages } from "./gmail.service";
import { runEmailAgent } from "../agents/email/runner";

export const handleScanUser = async (userId: string) => {
  const messageIds = await handleListNewMessages(userId);
  const results: { userId: string; messageId: string; ok: boolean }[] = [];

  for (const messageId of messageIds) {
    try {
      await runEmailAgent(userId, messageId);
      results.push({ userId, messageId, ok: true });
    } catch (error) {
      console.error("Agent run failed", { userId, messageId, error });
      results.push({ userId, messageId, ok: false });
    }
  }

  return results;
};

export const handleScanAllUsers = async () => {
  const users = await prisma.user.findMany({
    where: { googleRefreshToken: { not: null } },
    select: { id: true },
  });

  const results: { userId: string; messageId: string; ok: boolean }[] = [];

  for (const user of users) {
    const messageIds = await handleListNewMessages(user.id);

    for (const messageId of messageIds) {
      try {
        await runEmailAgent(user.id, messageId);
        results.push({ userId: user.id, messageId, ok: true });
      } catch (error) {
        console.error("Agent run failed", {
          userId: user.id,
          messageId,
          error,
        });
        results.push({ userId: user.id, messageId, ok: false });
      }
    }
  }

  return results;
};
