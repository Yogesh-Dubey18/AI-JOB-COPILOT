import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as s3GetSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { env } from "../config/env.js";

const provider = env.STORAGE_PROVIDER || "local";
const bucketName = env.STORAGE_BUCKET_NAME;
const accessKeyId = env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = env.STORAGE_SECRET_ACCESS_KEY;
const region = env.STORAGE_REGION || "us-east-1";
const endpoint = env.STORAGE_ENDPOINT;
const ttl = Number.isFinite(env.STORAGE_SIGNED_URL_TTL_SECONDS) && env.STORAGE_SIGNED_URL_TTL_SECONDS > 0
  ? env.STORAGE_SIGNED_URL_TTL_SECONDS
  : 900;

const isS3Configured = Boolean(
  (provider === "s3" || provider === "r2") &&
  bucketName &&
  accessKeyId &&
  secretAccessKey
);

let s3Client: S3Client | null = null;
if (isS3Configured) {
  const config: any = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  };
  if (endpoint) {
    config.endpoint = endpoint;
    config.forcePathStyle = true;
  }
  s3Client = new S3Client(config);
}

const localUploadDir = path.join(process.cwd(), "uploads");

export function isConfigured(): boolean {
  return isS3Configured;
}

export function getProvider(): string {
  return isS3Configured ? provider : "local";
}

export function getSignedUrlTtlSeconds(): number {
  return ttl;
}

export function normalizeStorageKey(fileKey: string): string {
  const normalizedKey = String(fileKey || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalizedKey ||
    normalizedKey.includes("\0") ||
    normalizedKey.startsWith("file:") ||
    /^[a-zA-Z]:/.test(normalizedKey) ||
    /^https?:\/\//i.test(normalizedKey) ||
    normalizedKey.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error("Invalid storage key");
  }
  return normalizedKey;
}

export function getStorageStatus() {
  const requestedProvider = provider === "s3" || provider === "r2" ? provider : "local";
  const activeProvider = getProvider();
  const providerReady = Boolean(isS3Configured);
  return {
    requestedProvider,
    provider: activeProvider,
    activeProvider,
    configured: providerReady,
    providerReady,
    live: false,
    status: providerReady ? "provider_ready" : "local_fallback",
    label: providerReady
      ? `${String(requestedProvider).toUpperCase()} provider-ready signed URLs configured; verify bucket access before marking Live.`
      : "Local fallback storage (not production-durable)",
    localFallback: activeProvider === "local",
    signedUrlTtlSeconds: ttl,
    bucketConfigured: Boolean(bucketName),
    endpointConfigured: Boolean(endpoint),
    manualSetupRequired: activeProvider === "local"
  };
}

export async function uploadFile(fileKey: string, buffer: Buffer, mimetype: string): Promise<string> {
  const safeKey = normalizeStorageKey(fileKey);
  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: safeKey,
      Body: buffer,
      ContentType: mimetype
    });
    await s3Client.send(command);
    return safeKey;
  } else {
    // Local fallback mode
    const localPath = path.join(localUploadDir, safeKey);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);
    return safeKey;
  }
}

export async function deleteFile(fileKey: string): Promise<void> {
  const safeKey = normalizeStorageKey(fileKey);
  if (isS3Configured && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: safeKey
    });
    await s3Client.send(command);
  } else {
    // Local fallback mode
    const localPath = path.join(localUploadDir, safeKey);
    await fs.unlink(localPath).catch(() => {});
  }
}

async function bodyToBuffer(body: any): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body instanceof Readable || typeof body[Symbol.asyncIterator] === "function") {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  return Buffer.from(String(body));
}

export async function downloadFile(fileKey: string): Promise<Buffer> {
  const safeKey = normalizeStorageKey(fileKey);
  if (isS3Configured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: safeKey
    });
    const response = await s3Client.send(command);
    return bodyToBuffer(response.Body);
  }

  const localPath = path.join(localUploadDir, safeKey);
  return fs.readFile(localPath);
}

export async function getSignedUrl(fileKey: string): Promise<string> {
  const safeKey = normalizeStorageKey(fileKey);
  if (isS3Configured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: safeKey
    });
    return s3GetSignedUrl(s3Client, command, { expiresIn: ttl });
  } else {
    // Local fallback mode
    // We return a public url path served by the express server (e.g. /uploads/key)
    return `/uploads/${safeKey}`;
  }
}
