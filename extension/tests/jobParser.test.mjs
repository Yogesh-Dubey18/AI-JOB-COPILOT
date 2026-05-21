import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { interestMessage } from "../dist/messageTemplates.js";
import { parseJobFromText } from "../dist/jobParser.js";

describe("extension job parser", () => {
  it("extracts a reviewed job draft from visible page text", () => {
    const draft = parseJobFromText(
      "React Developer at PixelCraft Labs\nLocation Remote\nRequirements React TypeScript Node.js MongoDB\nNo registration fee should ever be paid.",
      "React Developer | PixelCraft Labs",
      "https://careers.example/jobs/react"
    );
    assert.equal(draft.title, "React Developer");
    assert.equal(draft.company, "PixelCraft Labs");
    assert.equal(draft.remoteType, "Remote");
    assert.ok(draft.skillsRequired.includes("React"));
    assert.ok(draft.riskFlags.length > 0);
  });

  it("creates a manual review outreach message", () => {
    const message = interestMessage({
      title: "MERN Stack Developer",
      company: "StackNova",
      location: "Remote",
      applyUrl: "https://example.com/apply",
      source: "Browser extension manual capture",
      description: "Build features",
      skillsRequired: ["React"],
      responsibilities: [],
      requirements: [],
      riskFlags: []
    });
    assert.match(message, /MERN Stack Developer/);
    assert.match(message, /official job link/);
  });
});
