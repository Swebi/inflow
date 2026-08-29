import { StateGraph, START, END } from "@langchain/langgraph";
import { EmailExtractionState, ActionState } from "./state";
import {
  readEmail,
  extractItems,
  dedupe,
  sendNotification,
  waitForDecision,
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
  .addNode("sendNotification", sendNotification)
  .addNode("waitForDecision", waitForDecision)
  .addNode("resolveAction", resolveAction)
  .addEdge(START, "sendNotification")
  .addEdge("sendNotification", "waitForDecision")
  .addEdge("waitForDecision", "resolveAction")
  .addEdge("resolveAction", END)
  .compile({ checkpointer });
