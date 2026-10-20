import { sendMail } from "../../../lib/mailer";
import { User } from "../../users/user.model";
import type { NotificationChannel } from "./channel";

export const emailChannel: NotificationChannel<"email"> = {
  name: "email",
  async send({ userId, email }, { subject, html }) {
    const to = email ?? (userId ? (await User.findById(userId, "email").lean())?.email : undefined);
    if (!to) {
      throw new Error(`No email address for recipient ${userId ?? "(none)"}`);
    }
    await sendMail(to, subject, html);
  },
};
