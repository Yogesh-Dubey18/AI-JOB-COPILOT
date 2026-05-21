import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  res.on("finish", () => {
    const path = req.originalUrl.split("?")[0] || req.path;
    if (!path.startsWith("/api") && !["/health", "/ready", "/status"].includes(path)) return;
    const durationMs = Date.now() - (req.startedAt || Date.now());
    logger.info("http_request", {
      requestId: req.requestId,
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.id || null
    });
  });
  next();
}
