// Live delivery of notification events to a user's open tabs.
//
// Each open tab holds a stream connection to one server instance, and listens there for events
// addressed to its user (see notification.controller.ts):
//
//   Without Redis: publishToUser() hands the event straight to the listeners on this instance.
//   With Redis:    publishToUser() publishes it to a Redis channel. Every instance subscribes to that
//                  channel and hands each event to its own listeners, so the user gets it whichever
//                  instance their tab is connected to.
import { EventEmitter } from "events";
import type { Redis } from "ioredis";
import { createRedisConnection, isRedisConfigured } from "../../lib/redis";

// What an open stream receives for its user.
export type RealtimeEvent =
  | { event: "notification"; data: unknown }
  | { event: "unread"; data: { count: number } };

type Listener = (event: RealtimeEvent) => void;

// The Redis channel all instances share, and the message format sent over it.
const REDIS_CHANNEL = "notifications:events";
type RedisMessage = { userId: string; event: RealtimeEvent };

// Listeners on this instance, keyed by user id: emitting `userId` reaches that user's open tabs.
const tabsOnThisServer = new EventEmitter();
// One listener per open tab; lift the default cap of 10 so busy instances don't warn.
tabsOnThisServer.setMaxListeners(0);

const deliverHere = (userId: string, event: RealtimeEvent) => {
  tabsOnThisServer.emit(userId, event);
};

// Redis connections, created on first use (a connection in subscribe mode can't also publish).
let publisher: Redis | undefined;
let listeningToRedis = false;

// Forwards every event published on the Redis channel to the matching tabs on this instance.
const listenToRedis = () => {
  if (listeningToRedis) return;
  listeningToRedis = true;

  const subscriber = createRedisConnection();
  subscriber.subscribe(REDIS_CHANNEL).catch((error) => console.error("Realtime subscribe failed:", error));
  subscriber.on("message", (_channel, message) => {
    try {
      const { userId, event } = JSON.parse(message) as RedisMessage;
      deliverHere(userId, event);
    } catch (error) {
      console.error("Malformed realtime message:", error);
    }
  });
};

// Sends an event to all of the user's open tabs.
export const publishToUser = async (userId: string, event: RealtimeEvent): Promise<void> => {
  if (!isRedisConfigured) {
    deliverHere(userId, event);
    return;
  }
  publisher ??= createRedisConnection();
  const message: RedisMessage = { userId, event };
  await publisher.publish(REDIS_CHANNEL, JSON.stringify(message));
};

// Calls `listener` for each event sent to the user. Returns a function that stops listening.
export const subscribeToUser = (userId: string, listener: Listener): (() => void) => {
  if (isRedisConfigured) listenToRedis();

  tabsOnThisServer.on(userId, listener);
  return () => {
    tabsOnThisServer.off(userId, listener);
  };
};
