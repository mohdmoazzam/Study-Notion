import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import type { UploadedFile } from "express-fileupload";
import { env } from "../config/env";

export const connectCloudinary = (): void => {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
};

export const uploadToCloudinary = (
  file: UploadedFile,
  options: Partial<Pick<UploadApiOptions, "height" | "quality">> = {}
): Promise<UploadApiResponse> =>
  cloudinary.uploader.upload(file.tempFilePath, {
    folder: env.cloudinary.folder,
    resource_type: "auto",
    ...options,
  });
