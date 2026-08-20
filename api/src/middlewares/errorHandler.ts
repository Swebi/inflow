import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/schema";

function isAppError(err: unknown): err is AppError {
  return typeof err === "object" && err !== null && "statusCode" in err;
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = isAppError(err) ? err.statusCode : 500;
  const message = isAppError(err)
    ? err.message
    : err.message || "Internal server error";

  console.error("Error:", {
    statusCode,
    message,
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({ success: false, message });
};
