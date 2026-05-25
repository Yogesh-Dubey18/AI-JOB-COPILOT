import { ErrorRequestHandler } from "express";
import { isProduction } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { captureException } from "../services/monitoring.service.js";

export const notFoundHandler = () => {
  throw new ApiError(404, "Route not found");
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let err = error;
  if (error && error.code === "LIMIT_FILE_SIZE") {
    err = new ApiError(400, "File is too large. Maximum allowed size is 5MB");
  } else if (error && error.name === "MulterError") {
    err = new ApiError(400, error.message || "File upload error");
  }

  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  if (!(err instanceof ApiError) || statusCode >= 500) {
    captureException(err, { requestId: _req.requestId, path: _req.path, method: _req.method, statusCode });
  }
  res.status(statusCode).json({
    success: false,
    message: err instanceof ApiError || !isProduction ? err.message || "Internal server error" : "Internal server error",
    details: err instanceof ApiError ? err.details : undefined,
    requestId: _req.requestId
  });
};
