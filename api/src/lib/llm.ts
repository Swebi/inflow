import { initChatModel } from "langchain";
import dotenv from "dotenv";

dotenv.config();

// Swap the active model here — "<provider>:<model>". Add entries to
// PROVIDER_API_KEY_ENV below if you introduce a new provider.
export const MODEL = "google:gemini-2.5-flash";
// export const MODEL = "groq:llama-3.3-70b-versatile";

const PROVIDER_API_KEY_ENV: Record<string, string> = {
  google: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
};

let modelPromise: ReturnType<typeof initChatModel> | undefined;

export const getChatModel = () => {
  if (!modelPromise) {
    const provider = MODEL.split(":")[0] ?? "";
    const envVar = PROVIDER_API_KEY_ENV[provider];
    const apiKey = envVar ? process.env[envVar] : undefined;
    modelPromise = initChatModel(MODEL, apiKey ? { apiKey } : undefined);
  }
  return modelPromise;
};
