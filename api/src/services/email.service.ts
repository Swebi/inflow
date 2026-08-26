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

// Groq's free tier also caps tokens-per-minute, independent of RPM
// (gpt-oss-120b: 8000 TPM) — shared across every concurrent user scan in this
// process, so a fixed per-call interval alone isn't enough: several
// full-size emails back to back can still blow the budget within one
// minute even 12.5s apart. Track a rolling per-minute token estimate instead
// and hold a call until there's real budget for it. We deliberately don't
// shrink MAX_EMAIL_CHARS further to buy headroom here — cutting email
// content loses context the extraction needs. Re-tune alongside MODEL if you
// swap models/providers.
const MAX_EMAIL_CHARS = 12_000;
const TPM_LIMIT = 8_000;
// Empirically ~3.3 chars/token for this prompt's mix of instructions + email
// text (matches Groq's reported "Requested" token counts in logs).
// COMPLETION_TOKEN_BUDGET reserves headroom for the JSON answer plus
// whatever reasoning tokens gpt-oss still spends internally even with
// reasoning_format="hidden" (see lib/llm.ts).
const CHARS_PER_TOKEN = 3.3;
const COMPLETION_TOKEN_BUDGET = 700;
const TPM_WINDOW_MS = 60_000;

function estimateTokens(charLength: number): number {
  return Math.ceil(charLength / CHARS_PER_TOKEN) + COMPLETION_TOKEN_BUDGET;
}

let usageWindow: { at: number; tokens: number }[] = [];

async function waitForTpmBudget(
  estimatedTokens: number,
  logPrefix: string
): Promise<void> {
  for (;;) {
    const now = Date.now();
    usageWindow = usageWindow.filter((u) => now - u.at < TPM_WINDOW_MS);
    const used = usageWindow.reduce((sum, u) => sum + u.tokens, 0);
    // Never block forever on a single request bigger than the whole budget —
    // let it through and rely on the 429 retry path if Groq rejects it.
    if (used + estimatedTokens <= TPM_LIMIT || usageWindow.length === 0) {
      usageWindow.push({ at: now, tokens: estimatedTokens });
      return;
    }
    const waitMs = TPM_WINDOW_MS - (now - usageWindow[0]!.at) + 250;
    console.warn(
      `${logPrefix} TPM budget: ~${used}/${TPM_LIMIT} used in the last minute, this request needs ~${estimatedTokens} more — waiting ${waitMs}ms`
    );
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

let lastCallAt = 0;
let callChain: Promise<void> = Promise.resolve();

function throttledCall<T>(
  estimatedTokens: number,
  logPrefix: string,
  fn: () => Promise<T>
): Promise<T> {
  const result = callChain.then(async () => {
    const wait = Math.max(0, MIN_CALL_INTERVAL_MS - (Date.now() - lastCallAt));
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    await waitForTpmBudget(estimatedTokens, logPrefix);
    lastCallAt = Date.now();
    return fn();
  });
  callChain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

// Groq occasionally answers outside the bound tool, even with tool_choice
// forced — either with plain text like "[]" (code: tool_use_failed) or, on
// gpt-oss, a chain-of-thought ramble ending in something like "Thus final
// answer: []." (code: output_parse_failed). The API rejects both as errors,
// but the raw text survives on the thrown groq-sdk error's
// `error.error.failed_generation` field. Retrying doesn't help here — it's
// a deterministic model choice, not a transient glitch — so recover the
// data straight from that field instead of discarding it.
const RECOVERABLE_ERROR_CODES = new Set([
  "tool_use_failed",
  "output_parse_failed",
]);

function recoverFromFailedToolCall(
  error: unknown
): { events: ExtractedEvent[] } | undefined {
  const body = (
    error as { error?: { error?: { code?: string; failed_generation?: string } } }
  )?.error?.error;
  if (
    !body?.code ||
    !RECOVERABLE_ERROR_CODES.has(body.code) ||
    !body.failed_generation
  ) {
    return undefined;
  }
  const text = body.failed_generation;

  // Try the raw text first (covers a clean bare "[]"/"{...}" reply), then
  // fall back to the last JSON array/object literal embedded in it (covers
  // gpt-oss's occasional reasoning-then-answer replies).
  const candidates = [text, ...(text.match(/\{[\s\S]*\}|\[[\s\S]*\]/g) ?? [])];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const events = Array.isArray(parsed) ? parsed : parsed?.events;
      if (!Array.isArray(events)) continue;
      const result = ExtractedEventsSchema.safeParse({ events });
      if (result.success) return result.data;
    } catch {
      continue;
    }
  }
  return undefined;
}

async function invokeWithRetry(
  prompt: string,
  logPrefix: string,
  maxAttempts = 3
) {
  const model = await getChatModel();
  // Force tool-calling based structured output rather than each provider's
  // native json-schema mode — Groq's gpt-oss native mode (@langchain/groq
  // 1.3.1) leaves a stray `$schema` key in the generated payload that trips
  // its own strict-mode validator. functionCalling avoids that path and
  // works consistently across providers.
  const structuredModel = model.withStructuredOutput(ExtractedEventsSchema, {
    method: "functionCalling",
  });
  const estimatedTokens = estimateTokens(prompt.length);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await throttledCall(estimatedTokens, logPrefix, () =>
        structuredModel.invoke(prompt)
      );
    } catch (error) {
      const recovered = recoverFromFailedToolCall(error);
      if (recovered) {
        console.warn(
          `${logPrefix} Model answered outside the tool call; recovered ${recovered.events.length} item(s) from the raw output`
        );
        return recovered;
      }

      const message = error instanceof Error ? error.message : String(error);

      // A request that's too large for the TPM budget on its own (Groq:
      // "Request too large... on tokens per minute") can't be fixed by
      // waiting — MAX_EMAIL_CHARS should prevent this, but if it still
      // happens, fail fast rather than burning retries on a guaranteed loss.
      const isOversized = message.includes("Request too large");
      if (isOversized) throw error;

      const isRateLimited =
        message.includes("429") || message.includes("Too Many Requests");
      // gpt-oss models occasionally emit a malformed or missing tool call
      // under forced function-calling — a transient generation glitch, not
      // a quota problem, so a short flat retry (rather than backoff) is
      // enough to give the model another shot.
      const isTransientToolFailure =
        !isRateLimited && message.includes("tool_use_failed");
      if (!isRateLimited && !isTransientToolFailure) throw error;

      // A per-day quota can't be waited out within the same run — retrying
      // just burns time on a call that's guaranteed to fail until it resets.
      if (isRateLimited && message.includes("PerDay")) {
        console.error(
          `${logPrefix} Provider daily quota exhausted — will not retry (resets in ~24h, not per-minute).`
        );
        throw error;
      }

      if (attempt === maxAttempts) throw error;

      let delayMs: number;
      if (isRateLimited) {
        // Gemini reports its suggested wait as `"retryDelay":"7s"`; Groq
        // reports it as prose ("...try again in 7.6875s."). Parse either so
        // we wait the provider's actual suggested time instead of guessing
        // with a fixed backoff.
        const geminiMatch = message.match(/"retryDelay":"(\d+)s"/);
        const groqMatch = message.match(/try again in ([\d.]+)s/i);
        if (geminiMatch) {
          delayMs = parseInt(geminiMatch[1]!, 10) * 1000 + 1000;
        } else if (groqMatch) {
          delayMs = Math.ceil(parseFloat(groqMatch[1]!) * 1000) + 500;
        } else {
          delayMs = attempt * 15_000;
        }
        console.warn(
          `${logPrefix} Rate-limited, retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`
        );
      } else {
        delayMs = 2_000;
        console.warn(
          `${logPrefix} Model failed to produce a valid tool call, retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`
        );
      }
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
    const truncated = emailContent.length > MAX_EMAIL_CHARS;
    const content = truncated
      ? emailContent.slice(0, MAX_EMAIL_CHARS)
      : emailContent;
    if (truncated) {
      console.warn(
        `${logPrefix} Email content (${emailContent.length} chars) exceeds MAX_EMAIL_CHARS, truncating to ${MAX_EMAIL_CHARS}`
      );
    }

    const prompt = `${EMAIL_EXTRACTION_PROMPT}\n\nEmail content:\n${content}`;
    console.log(
      `${logPrefix} Sending request to LLM (prompt length: ${prompt.length}, email length: ${content.length})`
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
