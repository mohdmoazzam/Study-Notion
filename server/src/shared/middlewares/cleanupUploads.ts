import { unlink } from "fs/promises";
import type { RequestHandler } from "express";

// express-fileupload never removes its temp files, so delete them once the response is done.
export const cleanupUploads: RequestHandler = (req, res, next) => {
  res.on("close", () => {
    if (!req.files) return;
    for (const entry of Object.values(req.files)) {
      for (const file of Array.isArray(entry) ? entry : [entry]) {
        if (file.tempFilePath) {
          unlink(file.tempFilePath).catch(() => undefined);
        }
      }
    }
  });
  next();
};
