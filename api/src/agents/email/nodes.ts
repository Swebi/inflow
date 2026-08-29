import { interrupt } from "@langchain/langgraph";
import { handleGetMessage } from "../../services/gmail.service";
import { handleExtractEvents } from "../../services/email.service";
import {
  handleListRecentActions,
  handleRecordAction,
} from "../../services/actions.service";
import { handleCreateEvent } from "../../services/calendar.service";
import { handleCreateTask } from "../../services/tasks.service";
import { notifyIfLinked } from "../../services/telegram.service";
import { EmailExtractionState, ActionState } from "./state";
import { CreateEventData } from "../../types/schema";

// --- Graph A nodes ---

export const readEmail: typeof EmailExtractionState.Node = async (state) => {
  const emailContent = await handleGetMessage(state.userId, state.messageId);
  console.log(
    `[agent:${state.messageId}] readEmail: fetched ${emailContent.length} chars`
  );
  return { emailContent };
};

// The extraction LLM emits dates as "dd.MM.yyyy" (see prompts/email.ts).
// Actions are recorded and compared as ISO "yyyy-MM-dd" everywhere else in
// the app (see extension's actionToEvent), so normalize right at the
// boundary — every downstream node (dedupe, createAction, resolveAction,
// the Google Calendar/Tasks APIs) then works with one consistent format.
function toIsoDate(date: string): string {
  const match = date.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : date;
}

export const extractItems: typeof EmailExtractionState.Node = async (state) => {
  const raw = await handleExtractEvents(state.emailContent ?? "", state.messageId);
  const extractedItems = raw.map((item) => ({ ...item, date: toIsoDate(item.date) }));
  console.log(
    `[agent:${state.messageId}] extractItems: found ${extractedItems.length} candidate item(s)`,
    extractedItems.map((e) => ({ title: e.title, date: e.date, kind: e.kind }))
  );
  return { extractedItems };
};

export const dedupe: typeof EmailExtractionState.Node = async (state) => {
  const recent = await handleListRecentActions(state.userId, 200);

  const existingKeys = new Set(
    recent
      .filter((a) => a.status === "PENDING" || a.status === "APPROVED")
      .map((a) => `${a.title.trim().toLowerCase()}|${a.date ?? ""}`)
  );

  const extracted = state.extractedItems ?? [];
  const newItems = extracted.filter(
    (item) =>
      !existingKeys.has(`${item.title.trim().toLowerCase()}|${item.date}`)
  );
  const skipped = extracted.filter((item) =>
    existingKeys.has(`${item.title.trim().toLowerCase()}|${item.date}`)
  );

  console.log(
    `[agent:${state.messageId}] dedupe: ${extracted.length} extracted, ` +
      `${newItems.length} new, ${skipped.length} already tracked` +
      (skipped.length
        ? ` (skipped: ${skipped
            .map((s) => `"${s.title}" @ ${s.date}`)
            .join(", ")})`
        : "")
  );

  return { newItems };
};

// --- Graph B nodes ---

// Split into two nodes deliberately: any code before interrupt() inside the
// same node re-runs when the graph resumes (LangGraph replays the paused
// node from its start). sendNotification is a separate, already-completed
// node by the time we resume, so it won't re-fire and duplicate the message.
export const sendNotification: typeof ActionState.Node = async (state) => {
  await notifyIfLinked(state.userId, state.actionId, state.item);
  return {};
};

export const waitForDecision: typeof ActionState.Node = async (state) => {
  const decision = interrupt({ item: state.item });
  return { decision };
};

export const resolveAction: typeof ActionState.Node = async (state) => {
  const { decision, item, userId, actionId } = state;

  if (!decision?.approved) {
    await handleRecordAction({ id: actionId, userId, status: "REJECTED" });
    return {};
  }

  const overrides = (decision.overrides ?? {}) as Record<string, unknown>;
  const asString = (v: unknown) => (typeof v === "string" ? v : undefined);
  const date = asString(overrides.date) ?? item.date;

  if (decision.destination === "CALENDAR_EVENT") {
    await handleCreateEvent({
      userId,
      summary: asString(overrides.summary) ?? item.title,
      date,
      startTime: asString(overrides.startTime) ?? item.startTime ?? undefined,
      endTime: asString(overrides.endTime) ?? item.endTime ?? undefined,
      description: asString(overrides.notes) ?? item.notes,
      location: asString(overrides.location),
      color: asString(overrides.color) as CreateEventData["color"],
      timeZone: asString(overrides.timeZone),
      existingActionId: actionId,
      addedBy: "AGENT",
    });
  } else if (decision.destination === "TASK") {
    await handleCreateTask({
      userId,
      title:
        asString(overrides.title) ?? asString(overrides.summary) ?? item.title,
      notes: asString(overrides.notes) ?? item.notes,
      dueDate: date,
      dueTime: asString(overrides.startTime) ?? item.startTime ?? undefined,
      existingActionId: actionId,
      addedBy: "AGENT",
    });
  }

  return {};
};
