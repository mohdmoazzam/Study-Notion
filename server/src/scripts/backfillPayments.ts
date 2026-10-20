// Saves purchases made before payments were recorded, using the paid orders in Razorpay.
//
//   npm run backfill:payments            # dry run: lists what would be saved
//   npm run backfill:payments -- --write # saves them
//
// Safe to run again: records are keyed by Razorpay order id, so existing ones are left alone.
// Only StudyNotion orders count (they carry the buyer's id and course ids in their notes), and only
// for users in this database, since a Razorpay account can be shared with other apps or environments.
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../lib/database";
import { razorpay } from "../lib/razorpay";
import { decodeCoupon, decodeCourseIds, decodePlatformFee, recordPayment } from "../modules/payments/payment.service";
import { User } from "../modules/users/user.model";

const PAGE_SIZE = 100;
const write = process.argv.includes("--write");

interface RazorpayOrder {
  id: string;
  amount: number | string;
  currency: string;
  status: string;
  created_at: number;
  notes?: Record<string, string | number>;
}

const fetchPaidOrders = async (): Promise<RazorpayOrder[]> => {
  const paid: RazorpayOrder[] = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const { items } = (await razorpay.orders.all({ count: PAGE_SIZE, skip })) as unknown as { items: RazorpayOrder[] };
    paid.push(...items.filter((order) => order.status === "paid"));
    if (items.length < PAGE_SIZE) return paid;
  }
};

const capturedPaymentId = async (orderId: string): Promise<string | undefined> => {
  const { items } = (await razorpay.orders.fetchPayments(orderId)) as unknown as { items: { id: string; status: string }[] };
  return items.find((payment) => payment.status === "captured")?.id;
};

const main = async () => {
  await connectDatabase();
  const orders = (await fetchPaidOrders()).filter(
    (order) => order.notes?.userId && mongoose.isValidObjectId(String(order.notes.userId)) && decodeCourseIds(order.notes).length
  );
  console.log(`${orders.length} paid StudyNotion order(s) in Razorpay${write ? "" : " (dry run, pass --write to save)"}`);

  let saved = 0;
  for (const order of orders) {
    const userId = String(order.notes!.userId);
    const label = `${order.id} ₹${Number(order.amount) / 100} on ${new Date(order.created_at * 1000).toLocaleString()}`;
    if (!(await User.exists({ _id: userId }))) {
      console.log(`  skip ${label}: buyer not in this database`);
      continue;
    }
    const paymentId = await capturedPaymentId(order.id);
    if (!paymentId) {
      console.log(`  skip ${label}: no captured payment`);
      continue;
    }
    if (!write) {
      console.log(`  would save ${label}`);
      continue;
    }
    const created = await recordPayment(userId, decodeCourseIds(order.notes!), {
      orderId: order.id,
      paymentId,
      amountInPaise: Number(order.amount),
      currency: order.currency,
      coupon: decodeCoupon(order.notes!),
      platformFee: decodePlatformFee(order.notes!),
      paidAt: new Date(order.created_at * 1000),
    });
    if (created) saved++;
    console.log(`  ${created ? "saved" : "already recorded"} ${label}`);
  }
  if (write) console.log(`Done: ${saved} new record(s).`);
};

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
