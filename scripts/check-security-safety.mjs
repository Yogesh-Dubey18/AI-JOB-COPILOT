import { existsSync, readFileSync } from "node:fs";

const failures = [];
const requiredFiles = [
  "backend/src/middlewares/auth.middleware.ts",
  "backend/src/routes/auth.routes.ts",
  "backend/src/validators/auth.validator.ts",
  "backend/src/config/env.ts",
  "scripts/check-git-safety.mjs"
];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing security-critical file: ${file}`);
}

const envExamples = [".env.example", "backend/.env.example", "frontend/.env.example"];
const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /AIza[A-Za-z0-9_-]{20,}/,
  /mongodb(?:\+srv)?:\/\/[^<>\s:@]+:[^<>\s@]+@/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/
];

for (const file of envExamples) {
  const content = existsSync(file) ? readFileSync(file, "utf8") : "";
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) failures.push(`Secret-like value found in ${file}`);
  }
}

const authValidator = existsSync("backend/src/validators/auth.validator.ts")
  ? readFileSync("backend/src/validators/auth.validator.ts", "utf8")
  : "";
for (const expected of ["Password must include an uppercase letter", "Password must include a lowercase letter", "Password must include a number"]) {
  if (!authValidator.includes(expected)) failures.push(`Password policy missing: ${expected}`);
}

const authRoutes = existsSync("backend/src/routes/auth.routes.ts")
  ? readFileSync("backend/src/routes/auth.routes.ts", "utf8")
  : "";
if (!authRoutes.includes("rateLimit")) failures.push("Auth routes do not include rate limiting.");

const envConfig = existsSync("backend/src/config/env.ts")
  ? readFileSync("backend/src/config/env.ts", "utf8")
  : "";
if (!envConfig.includes("validateRuntimeEnv")) failures.push("Runtime env validation is missing.");

if (failures.length) {
  console.error("Security safety check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Security safety check passed.");
