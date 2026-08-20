import { Response, NextFunction } from "express";
import { handleListRecentActions } from "../services/actions.service";
import { AuthRequest, AppError } from "../types/schema";

export const listRecentActions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const data = await handleListRecentActions(req.user.userId);

    res.status(200).json({
      success: true,
      message: "Actions fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};
