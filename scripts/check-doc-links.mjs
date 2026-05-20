import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const markdownFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "build", "coverage", ".git"].includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      markdownFiles.push(fullPath);
    }
  }
}

walk(root);

const failures = [];
const markdownLinkPattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;

for (const file of markdownFiles) {
  const content = fs.readFileSync(file, "utf8");
  const links = [...content.matchAll(markdownLinkPattern)];

  for (const match of links) {
    const rawTarget = match[1].trim();
    if (
      rawTarget.startsWith("http://") ||
      rawTarget.startsWith("https://") ||
      rawTarget.startsWith("mailto:") ||
      rawTarget.startsWith("#") ||
      rawTarget.startsWith("tel:")
    ) {
      continue;
    }

    const targetWithoutAnchor = rawTarget.split("#")[0];
    if (!targetWithoutAnchor) {
      continue;
    }

    const decodedTarget = decodeURIComponent(targetWithoutAnchor);
    const resolved = path.resolve(path.dirname(file), decodedTarget);

    if (!resolved.startsWith(root) || !fs.existsSync(resolved)) {
      failures.push(`${path.relative(root, file)} -> ${rawTarget}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Broken documentation links found:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Documentation link check passed for ${markdownFiles.length} markdown files.`);
