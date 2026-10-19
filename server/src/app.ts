import os from "os";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import fileUpload from "express-fileupload";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { AppError } from "./shared/errors";
import { cleanupUploads } from "./shared/middlewares/cleanupUploads";
import { errorHandler, notFound } from "./shared/middlewares/error";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export const createApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: os.tmpdir(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
      abortOnLimit: true,
      limitHandler: (_req, _res, next) => next(new AppError(413, "File is too large")),
    })
  );
  app.use(cleanupUploads);

  app.get("/", (_req, res) => {
    res.json({ success: true, isSuccess: true, message: "Your server is up and running" });
  });
  app.use("/api/v1", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
