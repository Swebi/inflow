import { Response, NextFunction } from "express";
import { handleVerifyToken } from "../services/auth.service";
import { AuthRequest, AppError } from "../types/schema";

export const authMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw { statusCode: 401, message: "No token provided" } as AppError;
    }
    req.user = handleVerifyToken(authHeader.split(" ")[1]);
    next();
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      next(error);
      return;
    }
    next({ statusCode: 401, message: "Invalid token" } as AppError);
  }
};
