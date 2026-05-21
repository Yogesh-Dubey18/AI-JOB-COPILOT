import crypto from "node:crypto";
import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startedAt?: number;
    }
  }
}

function safeRequestId(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[^a-zA-Z0-9._:-]/g, "").slice(0, 80);
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = Array.isArray(req.headers["x-request-id"]) ? req.headers["x-request-id"][0] : req.headers["x-request-id"];
  const requestId = safeRequestId(incoming) || crypto.randomUUID();
  req.requestId = requestId;
  req.startedAt = Date.now();
  res.setHeader("X-Request-Id", requestId);
  next();
}
