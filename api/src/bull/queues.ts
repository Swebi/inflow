import { Queue, QueueEvents } from "bullmq";
import { redisConnection } from "./connection";

export const SCAN_QUEUE_NAME = "email-scan";
export const EMAIL_QUEUE_NAME = "email-process";

const defaultJobOptions = {
  attempts: 1,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
  removeOnComplete: 500,
  removeOnFail: 1000,
};

export const scanQueue = new Queue(SCAN_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions,
});

export const scanQueueEvents = new QueueEvents(SCAN_QUEUE_NAME, {
  connection: redisConnection,
});

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions,
});

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
});
