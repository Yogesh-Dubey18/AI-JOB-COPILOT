import IORedis from "ioredis";
import { env } from "./env.js";

let connection: any = null;

export function getRedisConnection() {
  if (!env.REDIS_URL) return null;
  if (!connection) {
    connection = new (IORedis as any)(env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return connection;
}
