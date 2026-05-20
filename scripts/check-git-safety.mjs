import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename } from "node:path";

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();

const runOrEmpty = (command, args, options = {}) => {
  try {
    return run(command, args, options);
  } catch {
    return "";
  }
};

const normalizePath = (value) =>
  value.replace(/\\/g, "/").replace(/^"|"$/g, "").trim();

const root = run("git", ["rev-parse", "--show-toplevel"]);
process.chdir(root);

const toLines = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const trackedFiles = toLines(runOrEmpty("git", ["ls-files"])).map(normalizePath);
const stagedFiles = toLines(runOrEmpty("git", ["diff", "--cached", "--name-only"])).map(
  normalizePath,
);
const statusFiles = toLines(
  runOrEmpty("git", ["status", "--porcelain=v1", "--untracked-files=all"]),
).map((line) => {
  const renamedPath = line.slice(3).includes(" -> ")
    ? line.slice(3).split(" -> ").pop()
    : line.slice(3);
  return normalizePath(renamedPath ?? "");
});

const filesToInspect = Array.from(
  new Set([...trackedFiles, ...stagedFiles, ...statusFiles].filter(Boolean)),
);

const requiredEnvExamples = [
  ".env.example",
  "backend/.env.example",
  "frontend/.env.example",
];

const gitignoreMustInclude = [
  ".env",
  ".env.*",
  "!.env.example",
  "!**/.env.example",
  "node_modules/",
  ".next/",
  "dist/",
  "coverage/",
  "playwright-report/",
  "test-results/",
  "backend/uploads/*",
  "*.pem",
  "*.key",
];

const pathSegments = (path) => normalizePath(path).toLowerCase().split("/");

const hasSegment = (path, segment) => pathSegments(path).includes(segment);

const isRealEnvFile = (path) => {
  const fileName = basename(normalizePath(path)).toLowerCase();
  if (fileName === ".env.example") return false;
  return fileName === ".env" || fileName.startsWith(".env.");
};

const forbiddenPathChecks = [
  {
    name: "real environment file",
    test: isRealEnvFile,
  },
  {
    name: "dependency directory",
    test: (path) => hasSegment(path, "node_modules"),
  },
  {
    name: "build or cache output",
    test: (path) =>
      [".next", "dist", "build", "coverage", "playwright-report", "test-results"].some(
        (segment) => hasSegment(path, segment),
      ),
  },
  {
    name: "generated export",
    test: (path) => ["exports", "generated"].some((segment) => hasSegment(path, segment)),
  },
  {
    name: "log file",
    test: (path) => normalizePath(path).toLowerCase().endsWith(".log"),
  },
  {
    name: "generated PDF",
    test: (path) => normalizePath(path).toLowerCase().endsWith(".pdf"),
  },
  {
    name: "extension build output",
    test: (path) =>
      normalizePath(path).toLowerCase().startsWith("extension/dist/") ||
      normalizePath(path).toLowerCase().startsWith("extension/build/"),
  },
  {
    name: "credential or private key path",
    test: (path) => {
      const lowerPath = normalizePath(path).toLowerCase();
      return (
        lowerPath.includes("credential") ||
        lowerPath.includes("service-account") ||
        lowerPath.includes("secret") ||
        lowerPath.endsWith(".pem") ||
        lowerPath.endsWith(".key")
      );
    },
  },
];

const suspiciousContentChecks = [
  { name: "OpenAI-style API key", pattern: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: "Google API key", pattern: /AIza[A-Za-z0-9_-]{20,}/ },
  {
    name: "MongoDB URI with embedded credentials",
    pattern: /mongodb(?:\+srv)?:\/\/[^<>\s:@]+:[^<>\s@]+@/i,
  },
  { name: "private key material", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

const failures = [];
const warnings = [];

for (const envExample of requiredEnvExamples) {
  if (!existsSync(envExample)) {
    failures.push(`Missing required env example: ${envExample}`);
    continue;
  }

  try {
    execFileSync("git", ["check-ignore", "-q", envExample], { stdio: "ignore" });
    failures.push(`Env example is ignored and would not be tracked: ${envExample}`);
  } catch {
    // Expected: env example files must not be ignored.
  }
}

const gitignore = existsSync(".gitignore") ? readFileSync(".gitignore", "utf8") : "";
if (!gitignore) {
  failures.push("Missing .gitignore");
} else {
  for (const expectedPattern of gitignoreMustInclude) {
    if (!gitignore.includes(expectedPattern)) {
      warnings.push(`.gitignore does not contain expected pattern: ${expectedPattern}`);
    }
  }
}

for (const filePath of filesToInspect) {
  for (const check of forbiddenPathChecks) {
    if (check.test(filePath)) {
      failures.push(`${check.name}: ${filePath}`);
    }
  }

  if (!existsSync(filePath)) continue;
  const stats = statSync(filePath);
  if (!stats.isFile() || stats.size > 1_000_000) continue;

  const content = readFileSync(filePath, "utf8");
  for (const check of suspiciousContentChecks) {
    if (check.pattern.test(content)) {
      failures.push(`${check.name} detected in ${filePath}`);
    }
  }
}

if (warnings.length > 0) {
  console.warn("Git safety warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length > 0) {
  console.error("Git safety check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Git safety check passed.");
