import { gemini } from "../lib/gemini";
import { EMAIL_EXTRACTION_PROMPT } from "../prompts/email";
import {
  ExtractedEvent,
  ExtractedEventKind,
} from "../types/schema";
import { cleanupMarkdown } from "../utils/helpers";

const DATE_FORMAT = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

function parseDateToMillis(dateStr: string): number {
  const m = dateStr.trim().match(DATE_FORMAT);
  if (!m) return Number.NaN;
  const [, d, month, y] = m;
  const month0 = parseInt(month!, 10) - 1;
  const day = parseInt(d!, 10);
  const year = parseInt(y!, 10);
  return new Date(year, month0, day).getTime();
}

const KIND_PRIORITY: Record<ExtractedEventKind, number> = {
  registration_deadline: 0,
  deadline: 1,
  event: 2,
  other: 3,
};

function sortByPriority(events: ExtractedEvent[]): ExtractedEvent[] {
  return [...events].sort((a, b) => {
    const ta = parseDateToMillis(a.date);
    const tb = parseDateToMillis(b.date);
    if (ta !== tb) return ta - tb;
    const ka = (a.kind ?? "other") as ExtractedEventKind;
    const kb = (b.kind ?? "other") as ExtractedEventKind;
    return (KIND_PRIORITY[ka] ?? 99) - (KIND_PRIORITY[kb] ?? 99);
  });
}

export const emailService = {
  extractEvents: async (
    emailContent: string,
    requestId?: string
  ): Promise<ExtractedEvent[]> => {
    const logPrefix = requestId ? `[${requestId}]` : "[email-service]";

    try {
      console.log(`${logPrefix} Initializing Gemini model (gemini-2.5-flash)`);
      const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `${EMAIL_EXTRACTION_PROMPT}\n\nEmail content:\n${emailContent}`;
      console.log(
        `${logPrefix} Sending request to Gemini API (prompt length: ${prompt.length}, email length: ${emailContent.length})`
      );

      const result = await model.generateContent(prompt);
      console.log(`${logPrefix} Received response from Gemini API`);

      const response = await result.response;
      const text = response.text();
      console.log(
        `${logPrefix} Raw Gemini response (length: ${text.length}):`,
        {
          preview: text.substring(0, 200),
          fullResponse: text,
        }
      );

      console.log(`${logPrefix} Cleaning markdown from response`);
      const cleanedText = cleanupMarkdown(text);
      console.log(
        `${logPrefix} Cleaned text (length: ${cleanedText.length}):`,
        {
          preview: cleanedText.substring(0, 200),
          fullCleanedText: cleanedText,
        }
      );

      console.log(`${logPrefix} Parsing JSON array from cleaned text`);
      let raw: unknown;
      try {
        raw = JSON.parse(cleanedText);
        console.log(`${logPrefix} Successfully parsed JSON`);
      } catch (parseError) {
        console.error(`${logPrefix} JSON parsing failed:`, {
          error:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parse error",
          cleanedText: cleanedText,
          stack: parseError instanceof Error ? parseError.stack : undefined,
        });
        throw new Error(
          `Failed to parse JSON response: ${
            parseError instanceof Error ? parseError.message : "Unknown error"
          }`
        );
      }

      const arr = Array.isArray(raw) ? raw : [];
      const events: ExtractedEvent[] = [];

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (!item || typeof item !== "object") continue;
        const title =
          typeof item.title === "string" ? item.title.trim() : "";
        const date = typeof item.date === "string" ? item.date.trim() : "";
        if (!title || !date) {
          console.warn(
            `${logPrefix} Skipping item ${i}: missing title or date`,
            item
          );
          continue;
        }
        const startTime =
          item.startTime == null || item.startTime === ""
            ? null
            : String(item.startTime).trim() || null;
        const endTime =
          item.endTime == null || item.endTime === ""
            ? null
            : String(item.endTime).trim() || null;
        const notes =
          typeof item.notes === "string" ? item.notes.trim() : undefined;
        const kind =
          typeof item.kind === "string" &&
          ["registration_deadline", "event", "deadline", "other"].includes(
            item.kind
          )
            ? (item.kind as ExtractedEventKind)
          : undefined;

        events.push({
          title,
          date,
          startTime: startTime ?? null,
          endTime: endTime ?? null,
          notes: notes || undefined,
          kind,
        });
      }

      const sorted = sortByPriority(events);
      console.log(`${logPrefix} Event extraction completed:`, {
        count: sorted.length,
        titles: sorted.map((e) => e.title),
        dates: sorted.map((e) => e.date),
        kinds: sorted.map((e) => e.kind),
      });

      return sorted;
    } catch (error) {
      console.error(`${logPrefix} Error extracting events from email:`, {
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined,
        emailContentLength: emailContent.length,
      });
      throw new Error(
        `Failed to extract event information from email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
};
