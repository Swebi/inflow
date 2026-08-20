import { Request, Response, NextFunction } from "express";
import { handleExtractEvents } from "../services/email.service";
import { AppError } from "../types/schema";

export const processEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const requestId = Date.now().toString();
  console.log(`[${requestId}] Email processing request received`);

  try {
    const { emailContent } = req.body;

    if (!emailContent || typeof emailContent !== "string") {
      throw { statusCode: 400, message: "emailContent is required and must be a string" } as AppError;
    }

    const events = await handleExtractEvents(emailContent, requestId);

    if (events.length === 0) {
      throw { statusCode: 404, message: "No event information found in the email" } as AppError;
    }

    res.status(200).json({
      success: true,
      message: "Events extracted successfully",
      data: { events },
    });
  } catch (error) {
    next(error);
  }
};
