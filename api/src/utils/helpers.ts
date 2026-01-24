/**
 * Removes markdown code block formatting from a string.
 * Handles both ```json and plain ``` code blocks.
 */
export function cleanupMarkdown(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```\n?/g, "");
  }
  return cleaned;
}
