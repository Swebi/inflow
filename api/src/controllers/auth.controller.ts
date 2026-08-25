import { Request, Response, NextFunction } from "express";
import {
  handleRegister,
  handleLogin,
  handleGetMe,
  handleChangePassword,
} from "../services/auth.service";
import { AuthRequest, AppError } from "../types/schema";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      throw { statusCode: 400, message: "Email and password are required" } as AppError;
    }

    const data = await handleRegister(email, password, name);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw { statusCode: 400, message: "Email and password are required" } as AppError;
    }

    const data = await handleLogin(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const data = await handleGetMe(req.user.userId);

    res.status(200).json({
      success: true,
      message: "User details fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw {
        statusCode: 400,
        message: "Current and new password are required",
      } as AppError;
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      throw {
        statusCode: 400,
        message: "New password must be at least 8 characters",
      } as AppError;
    }

    await handleChangePassword(req.user.userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
