import { gemini } from "../lib/gemini";
import { EMAIL_EXTRACTION_PROMPT } from "../prompts/email";
import { ExtractedEvent } from "../types/schema";
import { cleanupMarkdown } from "../utils/helpers";

export const emailService = {
  extractEvent: async (
    emailContent: string,
    requestId?: string
  ): Promise<ExtractedEvent | null> => {
    const logPrefix = requestId ? `[${requestId}]` : "[email-service]";
    
    try {
      console.log(`${logPrefix} Initializing Gemini model (gemini-2.5-flash)`);
      const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `${EMAIL_EXTRACTION_PROMPT}\n\nEmail content:\n${emailContent}`;
      console.log(`${logPrefix} Sending request to Gemini API (prompt length: ${prompt.length}, email length: ${emailContent.length})`);

      const result = await model.generateContent(prompt);
      console.log(`${logPrefix} Received response from Gemini API`);
      
      const response = await result.response;
      const text = response.text();
      console.log(`${logPrefix} Raw Gemini response (length: ${text.length}):`, {
        preview: text.substring(0, 200),
        fullResponse: text,
      });

      console.log(`${logPrefix} Cleaning markdown from response`);
      const cleanedText = cleanupMarkdown(text);
      console.log(`${logPrefix} Cleaned text (length: ${cleanedText.length}):`, {
        preview: cleanedText.substring(0, 200),
        fullCleanedText: cleanedText,
      });

      console.log(`${logPrefix} Parsing JSON from cleaned text`);
      let eventData: ExtractedEvent;
      try {
        eventData = JSON.parse(cleanedText) as ExtractedEvent;
        console.log(`${logPrefix} Successfully parsed JSON:`, eventData);
      } catch (parseError) {
        console.error(`${logPrefix} JSON parsing failed:`, {
          error: parseError instanceof Error ? parseError.message : "Unknown parse error",
          cleanedText: cleanedText,
          stack: parseError instanceof Error ? parseError.stack : undefined,
        });
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
      }

      console.log(`${logPrefix} Validating extracted event data:`, {
        hasTitle: !!eventData.title,
        hasDate: !!eventData.date,
        title: eventData.title,
        date: eventData.date,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        notes: eventData.notes,
      });

      if (!eventData.title || !eventData.date) {
        console.warn(`${logPrefix} Validation failed: missing required fields (title or date)`, eventData);
        return null;
      }

      console.log(`${logPrefix} Event extraction completed successfully`);
      return eventData;
    } catch (error) {
      console.error(`${logPrefix} Error extracting event from email:`, {
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined,
        emailContentLength: emailContent.length,
      });
      throw new Error(`Failed to extract event information from email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
};
