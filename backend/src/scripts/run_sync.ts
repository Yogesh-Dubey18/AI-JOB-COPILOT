import { connectDB } from "../config/db.js";
import { runFullAdzunaSync } from "../services/job-providers/adzuna.provider.js";
import mongoose from "mongoose";

async function run() {
  console.log("Connecting to database...");
  await connectDB();
  console.log("Starting Adzuna sync...");
  try {
    const result = await runFullAdzunaSync();
    console.log("Sync result:", result);
  } catch (err: any) {
    console.error("Sync failed with error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

run();
