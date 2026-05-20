import mongoose from "mongoose";
import { env, isProduction } from "./env.js";

let ready = false;

export async function connectDB() {
  if (!env.MONGO_URI) {
    console.warn("MONGO_URI not configured. Using in-memory fallback store.");
    ready = false;
    return false;
  }

  try {
    await mongoose.connect(env.MONGO_URI);
    ready = true;
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    ready = false;
    console.error("MongoDB connection failed", error);
    if (isProduction) throw error;
    return false;
  }
}

export function isDbReady() {
  return ready && mongoose.connection.readyState === 1;
}
