import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";
import { createHmac, timingSafeEqual } from "node:crypto";
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
  secretAccessKey &&
  (provider !== "r2" || endpoint)
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
function storageSigningSecret(override?: string) {
  const secret = override !== undefined
    ? override
    : (env.STORAGE_SIGNING_SECRET || (env.NODE_ENV === "production" ? "" : env.JWT_ACCESS_SECRET));
  if (!secret || (env.NODE_ENV === "production" && (secret.length < 32 || !env.STORAGE_SIGNING_SECRET))) {
    throw new Error("Private storage signing is not configured");
  }
  return secret;
}

export function createStorageDownloadSignature(fileKey: string, expiresAt: number, ownerId: string, secret?: string) {
  if (!ownerId || ownerId.length > 128) throw new Error("Invalid storage owner");
  return createHmac("sha256", storageSigningSecret(secret)).update(`${ownerId}\n${fileKey}\n${expiresAt}`).digest("hex");
}

export function verifyStorageDownloadSignature(fileKey: string, ownerId: unknown, expiresAt: unknown, signature: unknown, now = Date.now()) {
  const expires = Number(expiresAt);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(now / 1000) || expires > Math.floor(now / 1000) + ttl + 5 || typeof ownerId !== "string" || ownerId.length < 1 || ownerId.length > 128 || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  let safeKey: string;
  try {
    safeKey = normalizeStorageKey(fileKey);
  } catch {
    return false;
  }

  let expectedSignature: string;
  try {
    expectedSignature = createStorageDownloadSignature(safeKey, expires, ownerId);
  } catch {
    return false;
  }
  const expected = Buffer.from(expectedSignature, "hex");
  const provided = Buffer.from(signature, "hex");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function isConfigured(): boolean {
  const active = getProvider();
  if (active === "s3" || active === "r2") return isS3Configured;
  if (active === "cloudinary") return isCloudinaryConfigured;
  return false;
}

export function getProvider(): string {
  if (provider === "s3" || provider === "r2") return provider;
  if (provider === "cloudinary") return "cloudinary";
  // Preserve deployments that previously selected Cloudinary only by providing its credentials.
  return isCloudinaryConfigured ? "cloudinary" : "local";
}

export function assertStorageProviderReady(active: string, configured: boolean) {
  if (active !== "local" && !configured) throw new Error(`${active.toUpperCase()} storage is selected but its configuration is incomplete`);
}

function assertProviderReady(active = getProvider()) {
  assertStorageProviderReady(active, active === "cloudinary" ? isCloudinaryConfigured : active === "local" ? true : isS3Configured);
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
  assertProviderReady(active);
  if (active === "cloudinary") {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: safeKey,
          resource_type: "raw",
          type: "authenticated"
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

async function getCloudinaryResource(key: string) {
  let lastError: unknown;
  for (const type of ["authenticated", "private", "upload"]) {
    try {
      return await cloudinary.api.resource(key, { resource_type: "raw", type });
    } catch (error: any) {
      lastError = error;
      const statusCode = error?.http_code || error?.error?.http_code;
      if (statusCode !== 404) throw error;
    }
  }
  throw lastError || new Error("Cloudinary file is unavailable");
}

export async function deleteFile(fileKey: string): Promise<void> {
  const safeKey = normalizeStorageKey(fileKey);
  const active = getProvider();
  assertProviderReady(active);
  if (active === "cloudinary") {
    const resource = await getCloudinaryResource(safeKey);
    await cloudinary.uploader.destroy(safeKey, { resource_type: "raw", type: resource.type });
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
  assertProviderReady(active);
  if (active === "cloudinary") {
    const resource = await getCloudinaryResource(safeKey);
    const cloudName = env.CLOUDINARY_CLOUD_NAME || cloudinary.config().cloud_name;
    if (resource.type === "upload" && !cloudName) throw new Error("Cloudinary is not configured");
    const url = resource.type === "upload"
      ? `https://res.cloudinary.com/${cloudName}/raw/upload/${safeKey}`
      : cloudinary.utils.private_download_url(resource.public_id, resource.format || "", {
        resource_type: "raw",
        type: resource.type,
        expires_at: Math.floor(Date.now() / 1000) + ttl,
        attachment: true
      });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Cloudinary file is unavailable");
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

export async function getSignedUrl(fileKey: string, ownerId: string): Promise<string> {
  const safeKey = normalizeStorageKey(fileKey);
  const expiresAt = Math.floor(Date.now() / 1000) + ttl;
  const signature = createStorageDownloadSignature(safeKey, expiresAt, ownerId);
  const query = new URLSearchParams({ key: safeKey, ownerId, expiresAt: String(expiresAt), signature });
  return `/api/storage/download?${query.toString()}`;
}
