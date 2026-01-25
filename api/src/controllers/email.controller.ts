import { Request, Response } from "express";
import { emailService } from "../services/email.service";

export const emailController = {
  processEmail: async (req: Request, res: Response) => {
    const requestId = Date.now().toString();
    console.log(`[${requestId}] Email processing request received`);
    
    try {
      const { emailContent } = req.body;

      console.log(`[${requestId}] Request body received:`, {
        hasEmailContent: !!emailContent,
        emailContentType: typeof emailContent,
        emailContentLength: typeof emailContent === "string" ? emailContent.length : 0,
      });

      if (!emailContent || typeof emailContent !== "string") {
        console.error(`[${requestId}] Validation failed: emailContent is missing or invalid`, {
          emailContent: emailContent,
          type: typeof emailContent,
        });
        return res.status(400).json({
          error: "emailContent is required and must be a string",
        });
      }

      console.log(`[${requestId}] Starting event extraction from email (length: ${emailContent.length})`);
      const event = await emailService.extractEvent(emailContent, requestId);

      if (!event) {
        console.warn(`[${requestId}] No event information found in the email`);
        return res.status(404).json({
          error: "No event information found in the email",
        });
      }

      console.log(`[${requestId}] Event extracted successfully:`, {
        title: event.title,
        date: event.date,
        hasStartTime: !!event.startTime,
        hasEndTime: !!event.endTime,
      });

      res.json(event);
    } catch (error) {
      console.error(`[${requestId}] Error processing email:`, {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
      });
      res.status(500).json({
        error: "Failed to process email",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
