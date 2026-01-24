import { Request, Response } from "express";
import { emailService } from "../services/email.service";

export const emailController = {
  processEmail: async (req: Request, res: Response) => {
    try {
      const { emailContent } = req.body;

      if (!emailContent || typeof emailContent !== "string") {
        return res.status(400).json({
          error: "emailContent is required and must be a string",
        });
      }

      const event = await emailService.extractEvent(emailContent);

      if (!event) {
        return res.status(404).json({
          error: "No event information found in the email",
        });
      }

      res.json(event);
    } catch (error) {
      console.error("Error processing email:", error);
      res.status(500).json({
        error: "Failed to process email",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
