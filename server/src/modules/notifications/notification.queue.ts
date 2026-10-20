import { Queue, Worker } from "bullmq";
import { createRedisConnection, isRedisConfigured } from "../../lib/redis";
import type { Delivery } from "./notification.types";

const QUEUE_NAME = "notifications";

let queue: Queue<Delivery> | undefined;
let worker: Worker<Delivery> | undefined;

// Undefined without Redis; callers then deliver in-process.
export const getNotificationQueue = (): Queue<Delivery> | undefined => {
  if (!isRedisConfigured) return undefined;
  queue ??= new Queue<Delivery>(QUEUE_NAME, {
    connection: createRedisConnection(),
    defaultJobOptions: {
      // About 5s, 10s, 20s, 40s between tries: enough to ride out a mail-provider blip.
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { count: 1_000 },
      removeOnFail: { age: 7 * 24 * 60 * 60 },
    },
  });
  return queue;
};

export const startNotificationWorker = (
  process: (delivery: Delivery) => Promise<void>,
): void => {
  if (!isRedisConfigured || worker) return;
  worker = new Worker<Delivery>(QUEUE_NAME, (job) => process(job.data), {
    connection: createRedisConnection(),
    concurrency: 10,
    // Seconds to block waiting while the queue is empty; new jobs still wake it immediately.
    // Longer waits mean fewer Redis commands, which matters on metered hosts like Upstash.
    drainDelay: 60,
  });
  worker.on("failed", (job, error) => {
    const attempts = job?.opts.attempts ?? 1;
    const final = (job?.attemptsMade ?? 0) >= attempts;
    console.error(
      `Notification ${job?.name} ${final ? "failed permanently" : `failed (attempt ${job?.attemptsMade}/${attempts})`}:`,
      error.message,
    );
  });
};

export const stopNotificationQueue = async (): Promise<void> => {
  await worker?.close();
  await queue?.close();
};
