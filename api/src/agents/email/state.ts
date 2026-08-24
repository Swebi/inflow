import { StateSchema } from "@langchain/langgraph";
import * as z from "zod";

const ExtractedEventSchema = z.object({
  title: z.string(),
  date: z.string(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  notes: z.string().optional(),
  kind: z.string().optional(),
});

export const EmailExtractionState = new StateSchema({
  userId: z.string(),
  messageId: z.string(),
  emailContent: z.string().optional(),
  extractedItems: z.array(ExtractedEventSchema).optional(),
  newItems: z.array(ExtractedEventSchema).optional(),
  actionIds: z.array(z.string()).optional(),
});

const DecisionSchema = z.object({
  approved: z.boolean(),
  destination: z.enum(["CALENDAR_EVENT", "TASK"]).optional(),
  overrides: z.record(z.string(), z.unknown()).optional(),
});

export const ActionState = new StateSchema({
  userId: z.string(),
  actionId: z.string(),
  item: ExtractedEventSchema,
  decision: DecisionSchema.optional(),
});

export type Decision = z.infer<typeof DecisionSchema>;
