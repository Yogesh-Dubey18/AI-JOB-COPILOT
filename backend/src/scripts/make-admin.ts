import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_EMAIL = "yogeshdubey8924@gmail.com";
const MONGO_URI = process.env.MONGO_URI || "";

async function makeAdmin() {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI not set in environment");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected!");

  // Step 1: Update user role to admin
  const userResult = await mongoose.connection.collection("users").updateOne(
    { email: ADMIN_EMAIL },
    { $set: { role: "admin" } }
  );
  console.log(`✅ User role updated: ${userResult.modifiedCount} document(s)`);

  // Step 2: Get user ID
  const user = await mongoose.connection.collection("users").findOne({ email: ADMIN_EMAIL });
  if (!user) {
    console.error(`❌ User not found: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const userId = user._id;
  console.log(`✅ Found user: ${userId}`);

  // Step 3: Upsert admin subscription
  await mongoose.connection.collection("subscriptions").updateOne(
    { userId },
    {
      $set: {
        userId,
        planId: "admin",
        status: "active",
        provider: "internal",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date(), __v: 0 }
    },
    { upsert: true }
  );
  console.log("✅ Admin subscription set!");

  // Step 4: Clear usage events (reset credits)
  const deleteResult = await mongoose.connection.collection("usageevents").deleteMany({ userId });
  console.log(`✅ Cleared ${deleteResult.deletedCount} usage events`);

  const deleteAiResult = await mongoose.connection.collection("airequests").deleteMany({ userId });
  console.log(`✅ Cleared ${deleteAiResult.deletedCount} AI request records`);

  await mongoose.disconnect();
  console.log(`\n🎉 Done! ${ADMIN_EMAIL} is now an admin with unlimited credits!`);
}

makeAdmin().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
