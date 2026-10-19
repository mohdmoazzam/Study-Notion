import dns from "dns";
import mongoose from "mongoose";
import { env } from "../config/env";

export const connectDatabase = async (): Promise<void> => {
  if (env.dnsServers.length > 0) {
    dns.setServers(env.dnsServers);
    dns.promises.setServers(env.dnsServers);
  }

  await mongoose.connect(env.mongoUrl, { maxPoolSize: 50, wtimeoutMS: 2500 });
  console.info("DB connected successfully");
};

export const disconnectDatabase = (): Promise<void> => mongoose.disconnect();
