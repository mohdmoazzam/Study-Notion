import { EventEmitter } from "events";
import type { Redis } from "ioredis";
import { createRedisConnection, isRedisConfigured } from "../../lib/redis";

const REDIS_CHANNEL = "notifications:events";

// What an open stream receives for its user.
export type RealtimeEvent =
  | { event: "notification"; data: unknown }
  | { event: "unread"; data: { count: number } };

type Listener = (event: RealtimeEvent) => void;

// Streams subscribe on the instance that holds their connection. With Redis, events are published
// through it so a notification created on any instance reaches the user's stream on any other.
const local = new EventEmitter();
// One listener per open tab; the default cap of 10 would warn for busy instances.
local.setMaxListeners(0);

let publisher: Redis | undefined;
let subscriberStarted = false;

const startSubscriber = () => {
  if (subscriberStarted || !isRedisConfigured) return;
  subscriberStarted = true;
  const subscriber = createRedisConnection();
  subscriber.subscribe(REDIS_CHANNEL).catch((error) => console.error("Realtime subscribe failed:", error));
  subscriber.on("message", (_channel, message) => {
    try {
      const { userId, event } = JSON.parse(message) as { userId: string; event: RealtimeEvent };
      local.emit(userId, event);
    } catch (error) {
      console.error("Malformed realtime message:", error);
    }
  });
};

export const publishToUser = async (userId: string, event: RealtimeEvent): Promise<void> => {
  if (!isRedisConfigured) {
    local.emit(userId, event);
    return;
  }
  publisher ??= createRedisConnection();
  await publisher.publish(REDIS_CHANNEL, JSON.stringify({ userId, event }));
};

// Returns the unsubscribe function.
export const subscribeToUser = (userId: string, listener: Listener): (() => void) => {
  startSubscriber();
  local.on(userId, listener);
  return () => {
    local.off(userId, listener);
  };
};
