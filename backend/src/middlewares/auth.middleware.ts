import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { findRecordById } from "../utils/repository.js";
import { ApiError } from "../utils/ApiError.js";
import { writeAuditLog } from "../services/audit-log.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "job_seeker" | "admin";
        fullName: string;
      };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const token = bearer || req.cookies?.accessToken;
    if (!token) throw new ApiError(401, "Authentication required");
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; typ?: string };
    if (decoded.typ !== "access") throw new ApiError(401, "Invalid access token type");
    const user = await findRecordById("users", decoded.sub);
    if (!user) throw new ApiError(401, "User no longer exists");
    req.user = { id: String(user._id), email: user.email, role: user.role, fullName: user.fullName };
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Invalid or expired token"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    void writeAuditLog({
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      action: "admin.denied",
      category: "admin",
      method: req.method,
      path: req.path,
      statusCode: 403,
      riskLevel: "medium"
    }).catch((error) => console.error("Admin denial audit failed", error));
    throw new ApiError(403, "Admin access required");
  }
  next();
}
