import { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler = () => {
  throw new ApiError(404, "Route not found");
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    details: error instanceof ApiError ? error.details : undefined
  });
};
