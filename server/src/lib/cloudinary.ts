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
  options: Partial<Pick<UploadApiOptions, "height" | "quality" | "resource_type" | "type">> & { subfolder?: string } = {}
): Promise<UploadApiResponse> => {
  const { subfolder, ...uploadOptions } = options;
  return cloudinary.uploader.upload(file.tempFilePath, {
    folder: subfolder ? `${env.cloudinary.folder}/${subfolder}` : env.cloudinary.folder,
    resource_type: "auto",
    ...uploadOptions,
  });
};

export const deleteFromCloudinary = (publicId: string, resourceType: string, type = "upload") =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type });

// Short-lived link to a private asset. It goes through Cloudinary's API, so it also works for
// file types (like PDF) whose public delivery is blocked on the account.
export const getPrivateDownloadUrl = (
  publicId: string,
  format: string,
  resourceType: string,
  expiresInSeconds = 5 * 60
): string =>
  cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: "private",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
