import { Response, NextFunction } from "express";
import {
  handleListRecentActions,
  handleResumeAction,
} from "../services/actions.service";
import { AuthRequest, AppError } from "../types/schema";

export const listRecentActions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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

export const approveAction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user)
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    const { id } = req.params;
    const { destination, ...overrides } = req.body;

    if (!destination) {
      throw { statusCode: 400, message: "destination is required" } as AppError;
    }

    const result = await handleResumeAction(req.user.userId, id, {
      approved: true,
      destination,
      overrides,
    });

    res
      .status(200)
      .json({ success: true, message: "Action approved", data: result });
  } catch (error) {
    next(error);
  }
};

export const rejectAction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user)
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    const { id } = req.params;

    const result = await handleResumeAction(req.user.userId, id, {
      approved: false,
    });

    res
      .status(200)
      .json({ success: true, message: "Action rejected", data: result });
  } catch (error) {
    next(error);
  }
};
