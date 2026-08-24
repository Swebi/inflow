import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

export const checkpointer = PostgresSaver.fromConnString(
  process.env.DATABASE_URL!
);

let setupDone = false;

export const ensureCheckpointerSetup = async () => {
  if (setupDone) return;
  await checkpointer.setup();
  setupDone = true;
};
