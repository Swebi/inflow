import { AsyncLocalStorage } from "async_hooks";
import type { Job } from "bullmq";

const jobContext = new AsyncLocalStorage<Job>();

const format = (args: unknown[]) =>
  args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ");

const patch = (original: (...args: unknown[]) => void) =>
  (...args: unknown[]) => {
    original(...args);
    const job = jobContext.getStore();
    if (job) {
      job.log(format(args)).catch(() => {});
    }
  };

console.log = patch(console.log.bind(console));
console.warn = patch(console.warn.bind(console));
console.error = patch(console.error.bind(console));

export const runWithJobLogging = <T>(job: Job, fn: () => Promise<T>) =>
  jobContext.run(job, fn);
