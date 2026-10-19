import { env } from "./config/env";
import { createApp } from "./app";
import { connectCloudinary } from "./lib/cloudinary";
import { connectDatabase, disconnectDatabase } from "./lib/database";
import { mailTransport } from "./lib/mailer";

const start = async (): Promise<void> => {
  connectCloudinary();
  await connectDatabase();

  const server = createApp().listen(env.port, () => {
    console.info(`App is running at ${env.port}`);
    console.info(`Email is sent via ${mailTransport}`);
  });

  const shutdown = (signal: string) => {
    console.info(`${signal} received, shutting down`);
    server.close(() => {
      disconnectDatabase().finally(() => process.exit(0));
    });
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
