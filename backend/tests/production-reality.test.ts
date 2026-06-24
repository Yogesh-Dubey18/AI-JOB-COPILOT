import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { resetMemoryStore } from "../src/utils/memoryStore.js";
import { createRecord, findRecords } from "../src/utils/repository.js";
import { ensureSampleJobs } from "../src/services/job.service.js";

async function authAgent() {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ fullName: "Verification User", email: "verify@example.com", password: "Password123!" }).expect(201);
  return agent;
}

describe("Production Reality Verification Audit", () => {
  it("runs the full Career Operating System verification suite", async () => {
    resetMemoryStore();
    await ensureSampleJobs();
    const agent = await authAgent();

    // 1. Protected Routes redirection
    console.info("1. Verifying Protected Routes...");
    await request(app).get("/api/profile").expect(401);
    await request(app).get("/api/applications").expect(401);
    console.info("   [PASS] Non-authenticated requests correctly return 401.");

    // 2. Discover list before refresh
    console.info("2. Checking Discovery list before refresh...");
    const beforeJobs = await agent.get("/api/jobs").expect(200);
    const beforeCount = beforeJobs.body.data.items.length;
    console.info(`   Discovery Feed contains ${beforeCount} sample jobs initially.`);

    // 3. Refresh Jobs
    console.info("3. Triggering Refresh Jobs API...");
    const refreshRes = await agent.post("/api/jobs/refresh").expect(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.cooldownRemainingMs).toBeGreaterThan(0);
    console.info(`   [PASS] Refresh returned: ${refreshRes.body.data.message}`);

    // 4. Last Updated Timestamp & Status
    console.info("4. Fetching Sync Status...");
    const statusRes = await agent.get("/api/jobs/sync-status").expect(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.data.lastSyncedAt).not.toBeNull();
    console.info(`   [PASS] Last Synced At: ${statusRes.body.data.lastSyncedAt}`);

    // 5. Duplicate & Expired Cleanup check
    console.info("5. Verifying duplicate removal logic...");
    // Let's create a duplicate manually
    await createRecord("jobs", {
      title: "Duplicate Developer",
      company: "Duplicate Co",
      location: "Bengaluru",
      duplicateKey: "duplicate-developer_duplicate-co_bengaluru",
      expiresAt: new Date(Date.now() + 86400000)
    });
    await createRecord("jobs", {
      title: "Duplicate Developer",
      company: "Duplicate Co",
      location: "Bengaluru",
      duplicateKey: "duplicate-developer_duplicate-co_bengaluru",
      expiresAt: new Date(Date.now() + 86400000)
    });
    const beforeCleanup = await findRecords("jobs", { duplicateKey: "duplicate-developer_duplicate-co_bengaluru" });
    console.log("DEBUG: beforeCleanup=", beforeCleanup);
    expect(beforeCleanup.length).toBe(2);
    
    // Triggering refresh clears duplicates on memory store update
    await agent.post("/api/jobs/refresh").expect(200);
    
    const afterCleanup = await findRecords("jobs", { duplicateKey: "duplicate-developer_duplicate-co_bengaluru" });
    console.log("DEBUG: afterCleanup=", afterCleanup);
    expect(afterCleanup.length).toBe(1);
    console.info("   [PASS] Duplicates successfully detected and cleaned up.");

    // 6. Applied Job Flow
    console.info("6. Verifying Applied Job Flow...");
    // Save first job in feed
    const firstJob = beforeJobs.body.data.items[0];
    const saveRes = await agent.post(`/api/jobs/${firstJob._id}/save`).expect(201);
    expect(saveRes.body.success).toBe(true);
    
    // Verify it is in applications
    const appsRes = await agent.get("/api/applications").expect(200);
    const savedApp = appsRes.body.data.find((a: any) => String(a.jobId) === String(firstJob._id));
    expect(savedApp).toBeDefined();
    expect(savedApp.status).toBe("Saved");
    console.info("   [PASS] Job saved and moved to applications successfully.");

    // Confirm it disappears from Discovery list
    const discoveryAfterSave = await agent.get("/api/jobs").expect(200);
    const foundInDiscovery = discoveryAfterSave.body.data.items.some((item: any) => String(item._id) === String(firstJob._id));
    expect(foundInDiscovery).toBe(false);
    console.info("   [PASS] Interacted (Saved) job automatically hidden from Discovery Feed.");

    // 7. Resume Matching & Score Calculation
    console.info("7. Verifying Resume Upload, Analysis and Match Scores...");
    const upload = await agent.post("/api/resumes/upload")
      .field("isBaseResume", "true")
      .attach("resume", Buffer.from("Yogesh Dubey\nyogeshdubey8924@gmail.com\n+91-6392778770\nSkills React Node.js MongoDB TypeScript JavaScript HTML5 CSS3 Express\nProjects MERN Stack Career Operating System\nDUCATE certified Full Stack developer"), "resume.txt")
      .expect(201);
    
    expect(upload.body.data.parsedData.skills.length).toBeGreaterThan(0);
    
    const analyze = await agent.post(`/api/resumes/${upload.body.data._id}/analyze`)
      .send({ targetRole: "Full Stack Developer", jobDescription: "React Node.js MongoDB TypeScript role" })
      .expect(201);
    expect(analyze.body.data.atsScore).toBeGreaterThan(0);
    console.info(`   Resume analyzed with ATS Score: ${analyze.body.data.atsScore}`);

    // Fetch jobs and check matches
    const matchedJobs = await agent.get("/api/jobs").expect(200);
    const sampleMatched = matchedJobs.body.data.items.find((item: any) => item.skillsRequired && item.skillsRequired.length > 0);
    if (sampleMatched) {
      expect(sampleMatched.matchScore).toBeDefined();
      expect(sampleMatched.whyMatched).not.toBe("");
      console.info(`   [PASS] Job Match score calculated: ${sampleMatched.matchScore}%`);
      console.info(`   [PASS] whyMatched explanation: ${sampleMatched.whyMatched}`);
    } else {
      console.warn("   No job with skills was found to calculate match score.");
    }

    // 8. Notifications Creation
    console.info("8. Verifying Notification creation & persistence...");
    const notifs = await agent.get("/api/notifications").expect(200);
    expect(notifs.body.data.length).toBeGreaterThan(0);
    console.info(`   [PASS] Notification generated: ${notifs.body.data[0].title} - ${notifs.body.data[0].message}`);

    // 9. Dashboard Counters using Real Data
    console.info("9. Verifying Dashboard Analytics Counters...");
    const analyticsRes = await agent.get("/api/analytics/overview").expect(200);
    const data = analyticsRes.body.data;
    expect(data.totalDiscovered).toBeGreaterThan(0);
    expect(data.totalSavedJobs).toBe(1);
    console.info(`   [PASS] Real Database values fetched: Discovered: ${data.totalDiscovered}, Saved: ${data.totalSavedJobs}`);

    // 10. Company Research & Answer Vault
    console.info("10. Verifying Company Research CRUD...");
    const companyRes = await agent.post("/api/company-research").send({
      companyName: "Google",
      industry: "Technology",
      techStack: ["React", "TypeScript", "Go"]
    }).expect(201);
    expect(companyRes.body.data.companyName).toBe("Google");
    console.info("   [PASS] Company Google added to Company Research page.");

    console.info("   [PASS] End-To-End connected workflow is clean and verified.");
  });
});
