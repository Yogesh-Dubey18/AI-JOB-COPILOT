import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

try {
  require.resolve("@playwright/test");
} catch {
  console.log("Playwright is not installed. Skipping E2E tests; install @playwright/test to enable them.");
  process.exit(0);
}

execFileSync("npx", ["playwright", "test"], { shell: true, stdio: "inherit" });
