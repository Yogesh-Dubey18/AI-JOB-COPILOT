import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { checkAiCreditLimit } from "../services/usage-limit.service.js";

export function enforceAiCreditLimit(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await checkAiCreditLimit(req.user!.id, feature);
      if (!result.allowed) {
        next(new ApiError(402, "AI credit limit reached", result));
        return;
      }
      res.locals.usageLimit = result;
      next();
    } catch (error) {
      next(error);
    }
  };
}
