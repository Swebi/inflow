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
        emailContentLength:
          typeof emailContent === "string" ? emailContent.length : 0,
      });

      if (!emailContent || typeof emailContent !== "string") {
        console.error(
          `[${requestId}] Validation failed: emailContent is missing or invalid`,
          {
            emailContent: emailContent,
            type: typeof emailContent,
          }
        );
        return res.status(400).json({
          error: "emailContent is required and must be a string",
        });
      }

      console.log(
        `[${requestId}] Starting event extraction from email (length: ${emailContent.length})`
      );
      const events = await emailService.extractEvents(emailContent, requestId);

      if (events.length === 0) {
        console.warn(`[${requestId}] No event information found in the email`);
        return res.status(404).json({
          error: "No event information found in the email",
        });
      }

      console.log(`[${requestId}] Events extracted successfully:`, {
        count: events.length,
        titles: events.map((e) => e.title),
        dates: events.map((e) => e.date),
      });

      return res.json({ events });
    } catch (error) {
      console.error(`[${requestId}] Error processing email:`, {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
      });
      return res.status(500).json({
        error: "Failed to process email",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
