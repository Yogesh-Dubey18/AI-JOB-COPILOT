import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { createStorageDownloadSignature, deleteFile, getSignedUrl, uploadFile } from "../src/services/storage.service.js";
import { createRecord, deleteRecords } from "../src/utils/repository.js";
import { validateResumeBuffer } from "../src/services/file-validation.service.js";

describe("local storage download access", () => {
  const fileKeys: Array<{ key: string; ownerId: string }> = [];

  afterEach(async () => {
    const keys = fileKeys.splice(0);
    await Promise.all(keys.map(({ key }) => deleteFile(key)));
    await Promise.all(keys.map(({ key, ownerId }) => deleteRecords("resumes", { fileUrl: key, userId: ownerId })));
  });

  it("serves an uploaded file through a valid temporary signature only", async () => {
    const fileKey = `test/private-${Date.now()}.txt`;
    const ownerId = `owner-${Date.now()}`;
    fileKeys.push({ key: fileKey, ownerId });
    await uploadFile(fileKey, Buffer.from("private resume fixture"), "text/plain");
    await createRecord("resumes", { userId: ownerId, fileName: "resume.txt", fileUrl: fileKey, fileType: "text/plain" });
    const signedUrl = await getSignedUrl(fileKey, ownerId);

    const download = await request(app).get(signedUrl).expect(200);
    expect(download.headers["cache-control"]).toContain("no-store");
    expect(download.headers["content-disposition"]).toContain("attachment");
    expect(download.body.toString()).toBe("private resume fixture");

    const tampered = new URL(signedUrl, "https://backend.example");
    tampered.searchParams.set("signature", "0".repeat(64));
    await request(app).get(`${tampered.pathname}${tampered.search}`).expect(403);

    const changedOwner = new URL(signedUrl, "https://backend.example");
    changedOwner.searchParams.set("ownerId", "another-user");
    await request(app).get(`${changedOwner.pathname}${changedOwner.search}`).expect(403);

    const mismatchedOwner = `other-owner-${Date.now()}`;
    const wrongOwnerSignature = createStorageDownloadSignature(fileKey, Number(new URL(signedUrl, "https://backend.example").searchParams.get("expiresAt")), mismatchedOwner);
    const unauthorized = new URL(signedUrl, "https://backend.example");
    unauthorized.searchParams.set("ownerId", mismatchedOwner);
    unauthorized.searchParams.set("signature", wrongOwnerSignature);
    await request(app).get(`${unauthorized.pathname}${unauthorized.search}`).expect(404);

    await request(app).get(`/uploads/${fileKey}`).expect(404);
  });

  it("rejects an expired signed download URL", async () => {
    const fileKey = `test/expired-${Date.now()}.txt`;
    const ownerId = `owner-${Date.now()}`;
    fileKeys.push({ key: fileKey, ownerId });
    await uploadFile(fileKey, Buffer.from("expired fixture"), "text/plain");
    await createRecord("resumes", { userId: ownerId, fileName: "resume.txt", fileUrl: fileKey, fileType: "text/plain" });
    const expiredUrl = new URL(await getSignedUrl(fileKey, ownerId), "https://backend.example");
    expiredUrl.searchParams.set("expiresAt", "1");

    await request(app).get(`${expiredUrl.pathname}${expiredUrl.search}`).expect(403);
  });

  it("rejects signature creation without a configured secret", () => {
    expect(() => createStorageDownloadSignature("resumes/user/resume.pdf", 2_000_000_000, "user", "")).toThrow(/not configured/i);
  });

  it("does not authorize an unregistered storage object", async () => {
    const fileKey = `test/missing-${Date.now()}.txt`;
    const ownerId = `owner-${Date.now()}`;
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const signature = createStorageDownloadSignature(fileKey, expiresAt, ownerId);
    const query = new URLSearchParams({ key: fileKey, ownerId, expiresAt: String(expiresAt), signature });
    await request(app).get(`/api/storage/download?${query}`).expect(404);
  });

  it("authorizes only owned records and returns not-found after the object disappears", async () => {
    const fileKey = `test/absent-${Date.now()}.txt`;
    const ownerId = `owner-${Date.now()}`;
    const row = await createRecord("resumes", { userId: ownerId, fileName: "resume.txt", fileUrl: fileKey, fileType: "text/plain" });
    const signedUrl = await getSignedUrl(fileKey, ownerId);
    await request(app).get(signedUrl).expect(404);
    await deleteRecords("resumes", { _id: row._id, userId: ownerId });
  });

  it("rejects invalid resume content types before storage", () => {
    expect(() => validateResumeBuffer(Buffer.from("not a pdf"), "resume.pdf", "application/pdf")).toThrow(/does not match/i);
    expect(() => validateResumeBuffer(Buffer.from("data"), "payload.exe", "application/octet-stream")).toThrow(/only pdf and docx/i);
    expect(() => validateResumeBuffer(Buffer.alloc(5 * 1024 * 1024 + 1), "resume.pdf", "application/pdf")).toThrow(/too large/i);
  });
});
