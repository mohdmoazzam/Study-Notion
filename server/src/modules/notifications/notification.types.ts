import type { PayoutMethod, PayoutStatus } from "../payouts/payout.model";

// Every notification the app sends, and the data its templates need.
// The data travels through the queue as JSON, so it must be plain values (no Dates or documents).
export interface NotificationPayloads {
  "auth.otp": { otp: string };
  "auth.passwordReset": { url: string };
  "auth.passwordChanged": { name: string; email: string };
  "contact.confirmation": ContactDetails;
  "contact.received": ContactDetails;
  "course.enrolled": { name: string; courseName: string };
  // To the instructor when a student buys one of their courses.
  "course.newEnrollment": { studentName: string; courseName: string; price: number };
  "payment.succeeded": { name: string; amount: number; orderId: string; paymentId: string };
  "payout.processed": { name: string; payout: PayoutSummary };
}

export type NotificationType = keyof NotificationPayloads;

export interface ContactDetails {
  email: string;
  firstName: string;
  lastName: string;
  message: string;
  phone: string;
}

export interface PayoutSummary {
  status: PayoutStatus;
  amount: number;
  method: PayoutMethod;
  upiId?: string;
  bankAccount?: { bankName: string; accountNumber: string };
  reference?: string;
  adminNote?: string;
  hasReceipt: boolean;
}

// Who receives it. In-app needs `userId`; email uses `email`, or looks it up from `userId`.
export interface Recipient {
  userId?: string;
  email?: string;
}

// The two ways a notification is delivered.
export type ChannelName = "email" | "inApp";

export interface EmailContent {
  subject: string;
  html: string;
}

export const NOTIFICATION_TONES = ["success", "danger", "info"] as const;
export type NotificationTone = (typeof NOTIFICATION_TONES)[number];

export interface InAppContent {
  title: string;
  body: string;
  // Frontend route to open when the notification is clicked.
  link?: string;
  // Colours the icon in the notification list; the icon itself comes from the type.
  tone?: NotificationTone;
}

// One notification on one channel: what the queue stores and retries.
export interface Delivery {
  type: NotificationType;
  channel: ChannelName;
  recipient: Recipient;
  data: NotificationPayloads[NotificationType];
}
