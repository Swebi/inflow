import { Response, NextFunction } from "express";
import { handleScanUser } from "../services/agent.service";
import { AuthRequest, AppError } from "../types/schema";

export const scanNow = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user)
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    const data = await handleScanUser(req.user.userId);
    res.status(200).json({ success: true, message: "Scan complete", data });
  } catch (error) {
    next(error);
  }
};
