import { Redis } from "ioredis";
import { env } from "../config/env";

export const isRedisConfigured = Boolean(env.redisUrl);

const connections: Redis[] = [];

// A new connection per use: BullMQ workers block on theirs, and a pub/sub subscriber can't run other commands.
// `maxRetriesPerRequest: null` is required by BullMQ so commands wait out reconnects instead of failing.
export const createRedisConnection = (): Redis => {
  if (!isRedisConfigured) {
    throw new Error("REDIS_URL is not set");
  }
  const connection = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
  connection.on("error", (error) => console.error("Redis connection error:", error.message));
  connections.push(connection);
  return connection;
};

export const closeRedisConnections = async (): Promise<void> => {
  await Promise.allSettled(connections.map((connection) => connection.quit()));
};
