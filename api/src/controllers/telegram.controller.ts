import { randomUUID } from "crypto";
import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, AppError } from "../types/schema";

export const getLinkToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      throw { statusCode: 500, message: "Telegram bot is not configured" } as AppError;
    }

    let user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      throw { statusCode: 404, message: "User not found" } as AppError;
    }

    if (!user.telegramLinkToken) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { telegramLinkToken: randomUUID() },
      });
    }

    res.status(200).json({
      success: true,
      message: "Telegram link ready",
      data: {
        linked: Boolean(user.telegramChatId),
        deepLink: `https://t.me/${botUsername}?start=${user.telegramLinkToken}`,
      },
    });
  } catch (error) {
    next(error);
  }
};
