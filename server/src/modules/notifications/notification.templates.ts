import { contactUsEmail } from "../../emails/contactForm";
import { courseEnrollmentEmail } from "../../emails/courseEnrollment";
import { otpTemplate } from "../../emails/otpVerification";
import { passwordUpdated } from "../../emails/passwordUpdated";
import { paymentSuccessEmail } from "../../emails/paymentSuccess";
import { payoutStatusEmail } from "../../emails/payoutStatus";
import { escapeHtml } from "../../shared/utils/html";
import type {
  ChannelContent,
  ChannelName,
  ContactDetails,
  NotificationPayloads,
  NotificationType,
} from "./notification.types";

type Renderers<T> = { [C in ChannelName]?: (data: T) => ChannelContent[C] };

export interface NotificationTemplate<T> {
  // Sent on these unless the caller names its own channels.
  channels: ChannelName[];
  render: Renderers<T>;
}

const formatInr = (amount: number) =>
  // ₹999, or ₹999.50 when there are paise.
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

// User input is embedded in the HTML email, so it's escaped.
const contactHtml = ({ email, firstName, lastName, message, phone }: ContactDetails) =>
  contactUsEmail(escapeHtml(email), escapeHtml(firstName), escapeHtml(lastName), escapeHtml(message), escapeHtml(phone));

// Adding a notification type means adding it to NotificationPayloads and here; the compiler enforces both.
export const templates: { [T in NotificationType]: NotificationTemplate<NotificationPayloads[T]> } = {
  "auth.otp": {
    channels: ["email"],
    render: {
      email: ({ otp }) => ({ subject: "Verification E-mail From StudyNotion", html: otpTemplate(otp) }),
    },
  },
  "auth.passwordReset": {
    channels: ["email"],
    render: {
      email: ({ url }) => ({
        subject: "Password Reset Link",
        html: `Password Reset Link: <a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`,
      }),
    },
  },
  "auth.passwordChanged": {
    channels: ["email", "inApp"],
    render: {
      email: ({ name, email }) => ({
        subject: "Password for your account has been updated",
        html: passwordUpdated(email, `Password updated successfully for ${name}`),
      }),
      inApp: () => ({
        title: "Password changed",
        body: "Your password was updated. If this wasn't you, reset it right away.",
        link: "/dashboard/settings",
        tone: "info",
      }),
    },
  },
  "contact.confirmation": {
    channels: ["email"],
    render: {
      email: (details) => ({ subject: "Your Data send successfully", html: contactHtml(details) }),
    },
  },
  "contact.received": {
    channels: ["email"],
    render: {
      email: (details) => ({ subject: "Someone Send this data to you", html: contactHtml(details) }),
    },
  },
  "course.enrolled": {
    channels: ["email", "inApp"],
    render: {
      email: ({ name, courseName }) => ({
        subject: `Successfully Enrolled into ${courseName}`,
        html: courseEnrollmentEmail(courseName, name),
      }),
      inApp: ({ courseName }) => ({
        title: "You're enrolled",
        body: `${courseName} is now in your enrolled courses.`,
        link: "/dashboard/enrolled-courses",
        tone: "success",
      }),
    },
  },
  "course.newEnrollment": {
    channels: ["inApp"],
    render: {
      inApp: ({ studentName, courseName, price }) => ({
        title: "New student enrolled",
        body: `${studentName} bought ${courseName}${price > 0 ? ` (${formatInr(price)})` : ""}.`,
        link: "/dashboard/instructor",
        tone: "success",
      }),
    },
  },
  "payment.succeeded": {
    channels: ["email", "inApp"],
    render: {
      email: ({ name, amount, orderId, paymentId }) => ({
        subject: "Payment Received",
        html: paymentSuccessEmail(name, amount, orderId, paymentId),
      }),
      inApp: ({ amount }) => ({
        title: "Payment received",
        body: `We received your payment of ${formatInr(amount)}.`,
        link: "/dashboard/purchase-history",
        tone: "success",
      }),
    },
  },
  "payout.processed": {
    channels: ["email", "inApp"],
    render: {
      email: ({ name, payout }) => ({
        subject: payout.status === "Paid" ? "Your withdrawal has been paid" : "Your withdrawal request was rejected",
        html: payoutStatusEmail(name, payout),
      }),
      inApp: ({ payout }) =>
        payout.status === "Paid"
          ? {
              title: "Withdrawal paid",
              body: `${formatInr(payout.amount)} has been sent to you.`,
              link: "/dashboard/payouts?status=Paid",
              tone: "success",
            }
          : {
              title: "Withdrawal rejected",
              body: `Your request for ${formatInr(payout.amount)} was not approved; the amount is back in your balance.`,
              link: "/dashboard/payouts?status=Rejected",
              tone: "danger",
            },
    },
  },
};
