import { prisma } from "../lib/prisma";
import { handleListNewMessages, MessageNotFoundError } from "./gmail.service";
import { runEmailAgent } from "../agents/email/runner";

export const handleScanUser = async (userId: string) => {
  const messageIds = await handleListNewMessages(userId);
  console.log(
    `[agent-scan] user ${userId}: ${messageIds.length} new message(s)`
  );

  const results: { userId: string; messageId: string; ok: boolean }[] = [];

  for (const messageId of messageIds) {
    try {
      await runEmailAgent(userId, messageId);
      results.push({ userId, messageId, ok: true });
    } catch (error) {
      if (error instanceof MessageNotFoundError) {
        // Expected: message was deleted/moved between listing and fetching.
        console.warn(
          `[agent-scan] user ${userId}: message ${messageId} no longer exists, skipping`
        );
      } else {
        console.error("Agent run failed", { userId, messageId, error });
      }
      results.push({ userId, messageId, ok: false });
    }
  }

  const ok = results.filter((r) => r.ok).length;
  console.log(
    `[agent-scan] user ${userId}: finished, ${ok}/${results.length} message(s) processed successfully`
  );

  return results;
};

export const handleScanAllUsers = async () => {
  const users = await prisma.user.findMany({
    where: { googleRefreshToken: { not: null } },
    select: { id: true },
  });

  const results: { userId: string; messageId: string; ok: boolean }[] = [];
  for (const user of users) {
    results.push(...(await handleScanUser(user.id)));
  }

  return results;
};
