import { describe, expect, it } from "vitest";
import {
  uploadFile,
  getSignedUrl,
  deleteFile,
  isConfigured,
  getProvider,
  getSignedUrlTtlSeconds,
  getStorageStatus,
  normalizeStorageKey
} from "../src/services/storage.service.js";
import fs from "node:fs/promises";
import path from "node:path";

describe("Storage Abstraction Service", () => {
  it("defaults to local fallback provider when no S3/R2 config is present", () => {
    expect(isConfigured()).toBe(false);
    expect(getProvider()).toBe("local");
    expect(getSignedUrlTtlSeconds()).toBe(900);
    expect(getStorageStatus()).toMatchObject({
      provider: "local",
      configured: false,
      status: "local_fallback",
      localFallback: true,
      live: false
    });
  });

  it("uploads files, resolves a time-limited local download URL, and deletes them correctly in local mode", async () => {
    const fileKey = "test/resume-" + Date.now() + ".pdf";
    const buffer = Buffer.from("%PDF-1.4\n%test");
    
    // Test upload
    const uploadedKey = await uploadFile(fileKey, buffer, "application/pdf");
    expect(uploadedKey).toBe(fileKey);
    
    // Check file exists on disk
    const expectedPath = path.join(process.cwd(), "uploads", fileKey);
    const content = await fs.readFile(expectedPath);
    expect(content.toString()).toBe(buffer.toString());
    
    // Local download URLs carry an expiring signature instead of exposing a static path.
    const signedUrl = await getSignedUrl(fileKey, "test-owner");
    const parsedUrl = new URL(signedUrl, "https://backend.example");
    expect(parsedUrl.pathname).toBe("/api/storage/download");
    expect(parsedUrl.searchParams.get("key")).toBe(fileKey);
    expect(parsedUrl.searchParams.get("ownerId")).toBe("test-owner");
    expect(parsedUrl.searchParams.get("signature")).toMatch(/^[a-f0-9]{64}$/);
    expect(Number(parsedUrl.searchParams.get("expiresAt"))).toBeGreaterThan(Math.floor(Date.now() / 1000));
    
    // Test delete
    await deleteFile(fileKey);
    await expect(fs.access(expectedPath)).rejects.toThrow();
  });

  it("normalizes storage keys and rejects unsafe local or bucket paths", async () => {
    expect(normalizeStorageKey("proof\\safe-file.pdf")).toBe("proof/safe-file.pdf");
    expect(() => normalizeStorageKey("C:\\private\\resume.pdf")).toThrow(/Invalid storage key/i);
    expect(() => normalizeStorageKey("../private/resume.pdf")).toThrow(/Invalid storage key/i);
    expect(() => normalizeStorageKey("https://private-bucket.example/resume.pdf")).toThrow(/Invalid storage key/i);
    await expect(getSignedUrl("C:\\private\\resume.pdf", "test-owner")).rejects.toThrow(/Invalid storage key/i);
  });
});
