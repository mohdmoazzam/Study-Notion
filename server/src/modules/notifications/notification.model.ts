import { Schema, Types, model } from "mongoose";
import { NOTIFICATION_TONES, type NotificationTone } from "./notification.types";

const RETENTION_SECONDS = 90 * 24 * 60 * 60;

export interface INotification {
  user: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  link?: string;
  tone?: NotificationTone;
  // Null until the user reads it.
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "user", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String },
    tone: { type: String, enum: NOTIFICATION_TONES },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Newest-first listing, optionally only unread, and the unread count.
notificationSchema.index({ user: 1, readAt: 1, _id: -1 });
// MongoDB deletes notifications once they're older than the retention period.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

export const Notification = model<INotification>("Notification", notificationSchema);
