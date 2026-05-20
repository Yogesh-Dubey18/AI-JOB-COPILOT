import mongoose from "mongoose";
import { env, isProduction } from "./env.js";

let ready = false;
let connecting: Promise<boolean> | null = null;

mongoose.set("strictQuery", true);

export async function connectDB() {
  if (ready && mongoose.connection.readyState === 1) return true;
  if (connecting) return connecting;
  if (!env.MONGO_URI) {
    console.warn("MONGO_URI not configured. Using in-memory fallback store.");
    ready = false;
    return false;
  }

  connecting = mongoose
    .connect(env.MONGO_URI, {
      autoIndex: !isProduction,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8_000,
      socketTimeoutMS: 45_000
    })
    .then(() => {
      ready = true;
      console.log("MongoDB connected");
      return true;
    })
    .catch((error) => {
      ready = false;
      console.error("MongoDB connection failed", error);
      if (isProduction) throw error;
      return false;
    })
    .finally(() => {
      connecting = null;
    });

  return connecting;
}

export function isDbReady() {
  return ready && mongoose.connection.readyState === 1;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  ready = false;
}
