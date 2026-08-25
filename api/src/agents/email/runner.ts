import { randomUUID } from "crypto";
import { Command } from "@langchain/langgraph";
import { extractionGraph, actionGraph } from "./graph";
import { handleRecordAction } from "../../services/actions.service";
import { ExtractedEvent } from "../../types/schema";
import { Decision } from "./state";

export const runEmailAgent = async (userId: string, messageId: string) => {
  const result = await extractionGraph.invoke({ userId, messageId });

  const actionIds: string[] = [];
  for (const item of result.newItems ?? []) {
    const actionId = await createAction(userId, item);
    if (actionId) actionIds.push(actionId);
  }

  console.log(
    `[agent:${messageId}] runEmailAgent: ${result.extractedItems?.length ?? 0} extracted, ` +
      `${result.newItems?.length ?? 0} new, ${actionIds.length} PENDING action(s) created`
  );

  return { ...result, actionIds };
};

export const createAction = async (userId: string, item: ExtractedEvent) => {
  const threadId = randomUUID();

  const action = await handleRecordAction({
    userId,
    status: "PENDING",
    kind: item.kind,
    threadId,
    addedBy: "AGENT",
    title: item.title,
    date: item.date,
    startTime: item.startTime ?? undefined,
    endTime: item.endTime ?? undefined,
    notes: item.notes,
  });

  if (!action) return null;

  await actionGraph.invoke(
    { userId, actionId: action.id, item },
    { configurable: { thread_id: threadId } }
  );

  return action.id;
};

export const resumeAction = async (threadId: string, decision: Decision) => {
  return actionGraph.invoke(new Command({ resume: decision }), {
    configurable: { thread_id: threadId },
  });
};
