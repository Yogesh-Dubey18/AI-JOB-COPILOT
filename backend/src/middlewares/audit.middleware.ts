import { NextFunction, Request, Response } from "express";

export function auditLogger(req: Request, _res: Response, next: NextFunction) {
  if (req.path.startsWith("/api")) {
    console.info(JSON.stringify({ event: "api_request", method: req.method, path: req.path, userId: req.user?.id || null }));
  }
  next();
}
