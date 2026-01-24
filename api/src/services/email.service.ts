import { gemini } from "../lib/gemini";
import { EMAIL_EXTRACTION_PROMPT } from "../prompts/email";
import { ExtractedEvent } from "../types/schema";
import { cleanupMarkdown } from "../utils/helpers";

export const emailService = {
  extractEvent: async (
    emailContent: string
  ): Promise<ExtractedEvent | null> => {
    try {
      const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `${EMAIL_EXTRACTION_PROMPT}\n\nEmail content:\n${emailContent}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanedText = cleanupMarkdown(text);
      const eventData = JSON.parse(cleanedText) as ExtractedEvent;

      if (!eventData.title || !eventData.date) {
        return null;
      }

      return eventData;
    } catch (error) {
      console.error("Error extracting event from email:", error);
      throw new Error("Failed to extract event information from email");
    }
  },
};
