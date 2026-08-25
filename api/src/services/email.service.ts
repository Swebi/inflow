import { getChatModel } from "../lib/llm";
import { EMAIL_EXTRACTION_PROMPT } from "../prompts/email";
import { ExtractedEventsSchema } from "../agents/email/state";
import { ExtractedEvent } from "../types/schema";

// Free-tier LLM APIs cap requests per minute. Serialize calls with a floor
// interval so a burst (e.g. a first-time scan backfill) doesn't blow through
// the quota, and retry on 429 using the provider's own suggested retryDelay
// when available instead of just failing the whole extraction.
//
// This is paired with MODEL in lib/llm.ts — adjust it if you swap to a
// provider/model with a different free-tier RPM (Gemini 2.5 Flash: ~5 RPM).
const MIN_CALL_INTERVAL_MS = 12_500;
let lastCallAt = 0;
let callChain: Promise<void> = Promise.resolve();

function throttledCall<T>(fn: () => Promise<T>): Promise<T> {
  const result = callChain.then(async () => {
    const wait = Math.max(0, MIN_CALL_INTERVAL_MS - (Date.now() - lastCallAt));
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastCallAt = Date.now();
    return fn();
  });
  callChain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function invokeWithRetry(
  prompt: string,
  logPrefix: string,
  maxAttempts = 3
) {
  const model = await getChatModel();
  const structuredModel = model.withStructuredOutput(ExtractedEventsSchema);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await throttledCall(() => structuredModel.invoke(prompt));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRateLimited =
        message.includes("429") || message.includes("Too Many Requests");
      if (!isRateLimited) throw error;

      // A per-day quota can't be waited out within the same run — retrying
      // just burns time on a call that's guaranteed to fail until it resets.
      if (message.includes("PerDay")) {
        console.error(
          `${logPrefix} Provider daily quota exhausted — will not retry (resets in ~24h, not per-minute).`
        );
        throw error;
      }

      if (attempt === maxAttempts) throw error;

      const match = message.match(/"retryDelay":"(\d+)s"/);
      const delayMs = match
        ? parseInt(match[1], 10) * 1000 + 1000
        : attempt * 15_000;
      console.warn(
        `${logPrefix} Rate-limited, retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("unreachable");
}

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

function sortByPriority(events: ExtractedEvent[]): ExtractedEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const ta = parseDateToMillis(a.event.date);
      const tb = parseDateToMillis(b.event.date);
      if (ta !== tb) return ta - tb;

      const aIsDeadline = (a.event.kind ?? "").toLowerCase().includes("deadline") ? 0 : 1;
      const bIsDeadline = (b.event.kind ?? "").toLowerCase().includes("deadline") ? 0 : 1;
      if (aIsDeadline !== bIsDeadline) return aIsDeadline - bIsDeadline;

      return a.index - b.index;
    })
    .map(({ event }) => event);
}

export const handleExtractEvents = async (
  emailContent: string,
  requestId?: string
): Promise<ExtractedEvent[]> => {
  const logPrefix = requestId ? `[${requestId}]` : "[email-service]";

  try {
    const prompt = `${EMAIL_EXTRACTION_PROMPT}\n\nEmail content:\n${emailContent}`;
    console.log(
      `${logPrefix} Sending request to LLM (prompt length: ${prompt.length}, email length: ${emailContent.length})`
    );

    const { events: raw } = await invokeWithRetry(prompt, logPrefix);
    console.log(
      `${logPrefix} Received structured response from LLM: ${raw.length} candidate item(s)`,
      raw.map((e) => ({ title: e.title, date: e.date, kind: e.kind }))
    );

    const events: ExtractedEvent[] = raw
      .filter((item) => item.title.trim() && item.date.trim())
      .map((item) => ({
        title: item.title.trim(),
        date: item.date.trim(),
        startTime: item.startTime || null,
        endTime: item.endTime || null,
        notes: item.notes?.trim() || undefined,
        kind: item.kind?.trim().toLowerCase().replace(/\s+/g, "_") || undefined,
      }));

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
};
