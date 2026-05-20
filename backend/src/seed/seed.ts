import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { createRecord, findOneRecord } from "../utils/repository.js";
import { ensureSampleJobs } from "../services/job.service.js";

await connectDB();
await ensureSampleJobs();

const email = "fresher@example.com";
let user = await findOneRecord("users", { email });
if (!user) {
  user = await createRecord("users", {
    fullName: "Full Stack Fresher",
    email,
    passwordHash: await bcrypt.hash("Password123!", 12),
    role: "job_seeker",
    isEmailVerified: true
  });
  await createRecord("profiles", {
    userId: user._id,
    headline: "Full-stack fresher focused on MERN and Java fundamentals",
    education: [{ degree: "B.Tech / BCA", college: "Sample Institute", graduationYear: 2026 }],
    currentRole: "Student",
    targetRoles: ["MERN Stack Developer", "React Developer", "Junior Software Engineer"],
    experienceLevel: "fresher",
    totalExperienceYears: 0,
    skills: ["React", "Node.js", "Express", "MongoDB", "JavaScript", "Java", "DSA"],
    softSkills: ["Communication", "Ownership", "Learning agility"],
    preferredLocations: ["Remote", "Bengaluru", "Hyderabad"],
    preferredJobTypes: ["Full-time", "Internship"],
    expectedSalary: 500000,
    noticePeriod: "Immediate",
    githubUrl: "https://github.com/sample",
    linkedinUrl: "https://linkedin.com/in/sample",
    portfolioUrl: "https://portfolio.example.com",
    profileCompletenessScore: 95
  });
}

console.log("Seed complete. Sample login: fresher@example.com / Password123!");
