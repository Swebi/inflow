import { Request, Response, NextFunction } from "express";
import { emailService } from "../services/email.service";

export const emailController = {
  processEmail: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = Date.now().toString();
    console.log(`[${requestId}] Email processing request received`);

    try {
      const { emailContent } = req.body;

      if (!emailContent || typeof emailContent !== "string") {
        res.status(400).json({
          error: "emailContent is required and must be a string",
        });
        return;
      }

      const events = await emailService.extractEvents(emailContent, requestId);

      if (events.length === 0) {
        res.status(404).json({
          error: "No event information found in the email",
        });
        return;
      }

      res.json({ events });
    } catch (error) {
      next(error);
    }
  },
};
