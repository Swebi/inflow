import { Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../types/schema";

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }
    req.user = authService.verifyToken(authHeader.split(" ")[1]);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
