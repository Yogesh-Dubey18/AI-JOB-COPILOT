import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Cookie-authenticated, state-changing requests must come from an allowed origin.
 * Requests using an Authorization header, or carrying no auth cookies, are not CSRF-able.
 */
export function csrfOriginCheck(allowedOrigins: string[], exemptPaths: string[] = []) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method)) return next();
    if (exemptPaths.some((p) => req.path === p || req.originalUrl.split("?")[0] === p)) return next();
    if (req.headers.authorization) return next();
    if (!req.cookies?.accessToken && !req.cookies?.refreshToken) return next();
    const source = (req.headers.origin as string | undefined) || (() => {
      try { return req.headers.referer ? new URL(req.headers.referer as string).origin : undefined; } catch { return undefined; }
    })();
    if (source && allowedOrigins.includes(source)) return next();
    next(new ApiError(403, "Cross-site request blocked"));
  };
}
