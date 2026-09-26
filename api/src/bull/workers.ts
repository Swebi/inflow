import { Worker, Job } from "bullmq";
import { redisConnection } from "./connection";
import { SCAN_QUEUE_NAME, EMAIL_QUEUE_NAME } from "./queues";
import { handleScanAllUsers, handleProcessEmail } from "../services/agent.service";
import { runWithJobLogging } from "./jobLogger";

export const initScanWorker = () => {
  const worker = new Worker(
    SCAN_QUEUE_NAME,
    async (job: Job) => {
      return runWithJobLogging(job, () => handleScanAllUsers());
    },
    { connection: redisConnection, concurrency: 1 }
  );

  worker.on("completed", (job) => {
    console.log(`[bull:${SCAN_QUEUE_NAME}] job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[bull:${SCAN_QUEUE_NAME}] job ${job?.id} failed`, err);
  });

  worker.on("error", (err) => {
    console.error(`[bull:${SCAN_QUEUE_NAME}] worker error`, err);
  });

  return worker;
};

export const initEmailWorker = () => {
  const worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job: Job<{ userId: string; messageId: string }>) => {
      const { userId, messageId } = job.data;
      return runWithJobLogging(job, () => handleProcessEmail(userId, messageId));
    },
    { connection: redisConnection, concurrency: 1 }
  );

  worker.on("completed", (job) => {
    console.log(`[bull:${EMAIL_QUEUE_NAME}] job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[bull:${EMAIL_QUEUE_NAME}] job ${job?.id} failed`, err);
  });

  worker.on("error", (err) => {
    console.error(`[bull:${EMAIL_QUEUE_NAME}] worker error`, err);
  });

  return worker;
};
