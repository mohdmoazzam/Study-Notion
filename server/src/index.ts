import { env } from "./config/env";
import { createApp } from "./app";
import { connectCloudinary } from "./lib/cloudinary";
import { connectDatabase, disconnectDatabase } from "./lib/database";
import { mailTransport } from "./lib/mailer";
import { closeRedisConnections, isRedisConfigured } from "./lib/redis";
import { closeNotificationStreams } from "./modules/notifications/notification.controller";
import { stopNotificationQueue } from "./modules/notifications/notification.queue";
import { startNotifications } from "./modules/notifications/notification.service";

const start = async (): Promise<void> => {
  connectCloudinary();
  await connectDatabase();
  startNotifications();

  const server = createApp().listen(env.port, () => {
    console.info(`App is running at ${env.port}`);
    console.info(`Email is sent via ${mailTransport}`);
    console.info(`Links in emails point to ${env.clientUrl}`);
    if (env.isProduction && env.clientUrlIsLocal) {
      console.warn("WARNING: email links point to localhost. Add the deployed frontend URL to CLIENT_URL.");
    }
    console.info(`Notifications are ${isRedisConfigured ? "queued in Redis (BullMQ)" : "delivered in-process (no REDIS_URL)"}`);
  });

  const shutdown = (signal: string) => {
    console.info(`${signal} received, shutting down`);
    server.close(() => {
      stopNotificationQueue()
        .then(closeRedisConnections)
        .finally(() => disconnectDatabase().finally(() => process.exit(0)));
    });
    // Open notification streams never end on their own, so close() would otherwise wait forever.
    // Clients reconnect to another instance.
    closeNotificationStreams();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
