import { ErrorRequestHandler } from "express";
import { isProduction } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { captureException } from "../services/monitoring.service.js";

export const notFoundHandler = () => {
  throw new ApiError(404, "Route not found");
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  if (!(error instanceof ApiError) || statusCode >= 500) {
    captureException(error, { requestId: _req.requestId, path: _req.path, method: _req.method, statusCode });
  }
  res.status(statusCode).json({
    success: false,
    message: error instanceof ApiError || !isProduction ? error.message || "Internal server error" : "Internal server error",
    details: error instanceof ApiError ? error.details : undefined,
    requestId: _req.requestId
  });
};
