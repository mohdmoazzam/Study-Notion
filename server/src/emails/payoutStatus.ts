import { env } from "../config/env";
import type { IPayout } from "../modules/payouts/payout.model";
import { escapeHtml } from "../shared/utils/html";

const formatInr = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);

const describeDestination = ({ method, upiId, bankAccount }: IPayout): string =>
  method === "UPI"
    ? `UPI (${upiId})`
    : `${bankAccount?.bankName} account ending ${bankAccount?.accountNumber.slice(-4)}`;

export const payoutStatusEmail = (name: string, payout: IPayout): string => {
  const paid = payout.status === "Paid";
  const amount = escapeHtml(formatInr(payout.amount));

  return `<!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Withdrawal Update</title>
          <style>
              body { background-color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
              .logo { max-width: 200px; margin-bottom: 20px; }
              .message { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
              .body { font-size: 16px; margin-bottom: 20px; }
              .support { font-size: 14px; color: #999999; margin-top: 20px; }
              .highlight { font-weight: bold; }
          </style>
      </head>
      <body>
          <div class="container">
              <a href="https://studynotion-edtech-project.vercel.app"><img class="logo" src="https://i.ibb.co/7Xyj3PC/logo.png"
                      alt="StudyNotion Logo"></a>
              <div class="message">${paid ? "Withdrawal Paid" : "Withdrawal Request Rejected"}</div>
              <div class="body">
                  <p>Dear ${escapeHtml(name)},</p>
                  ${
                    paid
                      ? `<p>Your withdrawal of <span class="highlight">${amount}</span> has been sent to your ${escapeHtml(
                          describeDestination(payout)
                        )}.</p>
                  ${payout.reference ? `<p>Transaction reference: <b>${escapeHtml(payout.reference)}</b></p>` : ""}
                  ${
                    payout.receipt
                      ? `<p>The payment receipt is available on your <a href="${escapeHtml(
                          `${env.clientUrl}/dashboard/payouts?status=Paid`
                        )}">Payouts page</a>.</p>`
                      : ""
                  }`
                      : `<p>Your withdrawal request of <span class="highlight">${amount}</span> was not approved. The amount is back in your available balance.</p>`
                  }
                  ${payout.adminNote ? `<p>Note from our team: ${escapeHtml(payout.adminNote)}</p>` : ""}
              </div>
              <div class="support">If you have any questions or need assistance, please feel free to reach out to us at <a
                      href="mailto:info@studynotion.com">info@studynotion.com</a>. We are here to help!</div>
          </div>
      </body>
      </html>`;
};
