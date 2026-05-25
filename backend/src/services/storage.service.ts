import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as s3GetSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

const provider = env.STORAGE_PROVIDER || "local";
const bucketName = env.STORAGE_BUCKET_NAME;
const accessKeyId = env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = env.STORAGE_SECRET_ACCESS_KEY;
const region = env.STORAGE_REGION || "us-east-1";
const endpoint = env.STORAGE_ENDPOINT;
const ttl = env.STORAGE_SIGNED_URL_TTL_SECONDS || 900;

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

export async function uploadFile(fileKey: string, buffer: Buffer, mimetype: string): Promise<string> {
  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: mimetype
    });
    await s3Client.send(command);
    return fileKey;
  } else {
    // Local fallback mode
    const localPath = path.join(localUploadDir, fileKey);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);
    return fileKey;
  }
}

export async function deleteFile(fileKey: string): Promise<void> {
  if (isS3Configured && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey
    });
    await s3Client.send(command);
  } else {
    // Local fallback mode
    const localPath = path.join(localUploadDir, fileKey);
    await fs.unlink(localPath).catch(() => {});
  }
}

export async function getSignedUrl(fileKey: string): Promise<string> {
  if (isS3Configured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey
    });
    return s3GetSignedUrl(s3Client, command, { expiresIn: ttl });
  } else {
    // Local fallback mode
    // We return a public url path served by the express server (e.g. /uploads/key)
    const normalizedKey = fileKey.replace(/\\/g, "/");
    return `/uploads/${normalizedKey}`;
  }
}
