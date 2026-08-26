import { initChatModel } from "langchain";
import dotenv from "dotenv";

dotenv.config();

// Swap the active model here — "<provider>:<model>". Add entries to
// PROVIDER_API_KEY_ENV below if you introduce a new provider.
// export const MODEL = "google:gemini-2.5-flash";
// Groq retired the bare llama-3.x chat models — openai/gpt-oss-120b is the
// current closest equivalent. Check https://api.groq.com/openai/v1/models
// with your own key for what's actually live, the docs page lags behind it.
export const MODEL = "groq:openai/gpt-oss-120b";

const PROVIDER_API_KEY_ENV: Record<string, string> = {
  google: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
};

// gpt-oss-120b is a reasoning model: by default it burns a chain-of-thought
// pass before answering, and under forced function-calling it sometimes
// dumps that chain-of-thought as plain text instead of the tool call (surfaces
// as Groq's tool_use_failed/output_parse_failed errors). reasoningFormat
// "hidden" stops the raw reasoning from ever landing in the response content
// — a pure fix, the model reasons the same either way, we just stop
// returning the trace. reasoningEffort "medium" is Groq's own default for
// this model (i.e. what it was already doing before we started setting this
// field) — we set it explicitly rather than leaving it implicit so a future
// Groq default change can't silently alter behavior here. It's a real
// quality/cost tradeoff if lowered: the extraction prompt asks for real
// temporal reasoning (relative dates, year inference/rollover,
// deadline-vs-event ordering), which is exactly what "low" would cut corners
// on. The COMPLETION_TOKEN_BUDGET estimate in email.service.ts was
// calibrated from real Groq usage logs under this same default effort level,
// so it already accounts for it — re-tune both together only if you change
// this away from "medium".
const PROVIDER_EXTRA_PARAMS: Record<string, Record<string, unknown>> = {
  groq: { reasoningEffort: "medium", reasoningFormat: "hidden" },
};

let modelPromise: ReturnType<typeof initChatModel> | undefined;

export const getChatModel = () => {
  if (!modelPromise) {
    const provider = MODEL.split(":")[0] ?? "";
    const envVar = PROVIDER_API_KEY_ENV[provider];
    const apiKey = envVar ? process.env[envVar] : undefined;
    modelPromise = initChatModel(MODEL, {
      ...(apiKey ? { apiKey } : undefined),
      ...(PROVIDER_EXTRA_PARAMS[provider] ?? undefined),
    });
  }
  return modelPromise;
};
