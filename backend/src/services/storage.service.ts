import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as s3GetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v2 as cloudinary } from "cloudinary";
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

const isCloudinaryConfigured = Boolean(
  Boolean(env.CLOUDINARY_URL) ||
  Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) ||
  (provider === "cloudinary" && Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET))
);

if (isCloudinaryConfigured) {
  if (env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: env.CLOUDINARY_URL });
  } else {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET
    });
  }
}

if (env.NODE_ENV === "production" && !isCloudinaryConfigured && !isS3Configured) {
  console.warn("⚠️ [Storage Warning] Cloudinary / S3 is not configured in production. Using local disk fallback - uploaded files will be lost on server restart!");
}

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
  return isS3Configured || isCloudinaryConfigured;
}

export function getProvider(): string {
  return isCloudinaryConfigured ? "cloudinary" : (isS3Configured ? provider : "local");
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
  const requestedProvider = provider;
  const activeProvider = getProvider();
  const providerReady = isConfigured();
  return {
    requestedProvider,
    provider: activeProvider,
    activeProvider,
    configured: providerReady,
    providerReady,
    live: false,
    status: providerReady ? "provider_ready" : "local_fallback",
    label: providerReady
      ? `${String(activeProvider).toUpperCase()} provider-ready storage configured.`
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
  const active = getProvider();
  if (active === "cloudinary") {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: safeKey,
          resource_type: "raw"
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve(safeKey);
        }
      );
      Readable.from(buffer).pipe(stream);
    });
  } else if (active !== "local" && s3Client) {
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
  const active = getProvider();
  if (active === "cloudinary") {
    await cloudinary.uploader.destroy(safeKey, { resource_type: "raw" });
  } else if (active !== "local" && s3Client) {
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
  const active = getProvider();
  if (active === "cloudinary") {
    const url = await getSignedUrl(safeKey);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file from Cloudinary: ${response.statusText}`);
    return Buffer.from(await response.arrayBuffer());
  } else if (active !== "local" && s3Client) {
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
  const active = getProvider();
  if (active === "cloudinary") {
    if (safeKey.startsWith("http")) return safeKey;
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    return `https://res.cloudinary.com/${cloudName}/raw/upload/${safeKey}`;
  } else if (active !== "local" && s3Client) {
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
