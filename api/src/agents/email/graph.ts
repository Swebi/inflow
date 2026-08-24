import { StateGraph, START, END } from "@langchain/langgraph";
import { EmailExtractionState, ActionState } from "./state";
import {
  readEmail,
  extractItems,
  dedupe,
  notify,
  resolveAction,
} from "./nodes";
import { checkpointer } from "./checkpointer";

export const extractionGraph = new StateGraph(EmailExtractionState)
  .addNode("readEmail", readEmail)
  .addNode("extractItems", extractItems)
  .addNode("dedupe", dedupe)
  .addEdge(START, "readEmail")
  .addEdge("readEmail", "extractItems")
  .addEdge("extractItems", "dedupe")
  .addEdge("dedupe", END)
  .compile();

export const actionGraph = new StateGraph(ActionState)
  .addNode("notify", notify)
  .addNode("resolveAction", resolveAction)
  .addEdge(START, "notify")
  .addEdge("notify", "resolveAction")
  .addEdge("resolveAction", END)
  .compile({ checkpointer });
