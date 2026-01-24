import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { browser } from "wxt/browser";
import { Button } from "@/components/ui/button";

interface EventResponse {
  title: string;
  date: string;
  notes?: string;
}

function App() {
  const [emailContent, setEmailContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [response, setResponse] = useState<EventResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractEmailFromPage = useCallback(async () => {
    console.log("[Sidepanel] Starting email extraction...");
    setExtracting(true);
    setError(null);

    try {
      // Get the active tab
      console.log("[Sidepanel] Querying active tab...");
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      console.log("[Sidepanel] Active tab:", {
        id: tab.id,
        url: tab.url,
        title: tab.title,
      });

      if (!tab.id) {
        console.error("[Sidepanel] No tab ID found");
        throw new Error("Could not get active tab");
      }

      // Check if we're on Gmail
      if (!tab.url?.includes("mail.google.com")) {
        console.warn("[Sidepanel] Not on Gmail, current URL:", tab.url);
        setError("Please open a Gmail email to extract content");
        setExtracting(false);
        return;
      }

      console.log("[Sidepanel] On Gmail, sending extract message to content script...");

      // Send message to content script to extract email
      const response = await browser.tabs.sendMessage(tab.id, {
        action: "extractEmail",
      });

      console.log("[Sidepanel] Received response from content script:", {
        success: response?.success,
        hasContent: !!response?.content,
        contentLength: response?.content?.length,
        error: response?.error,
      });

      if (response?.success && response.content) {
        console.log(
          "[Sidepanel] Successfully extracted email content, length:",
          response.content.length
        );
        setEmailContent(response.content);
      } else {
        console.error("[Sidepanel] Extraction failed:", response?.error);
        throw new Error(response?.error || "Failed to extract email content");
      }
    } catch (err) {
      console.error("[Sidepanel] Error during extraction:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[Sidepanel] Error details:", {
        message: errorMessage,
        name: err instanceof Error ? err.name : "Unknown",
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError(
        errorMessage ||
          "Failed to extract email from page. Make sure you're viewing an email in Gmail."
      );
    } finally {
      console.log("[Sidepanel] Extraction process completed");
      setExtracting(false);
    }
  }, []);

  // Extract email content when sidepanel opens
  useEffect(() => {
    extractEmailFromPage();
  }, [extractEmailFromPage]);

  const handleSubmit = async () => {
    if (!emailContent.trim()) {
      console.warn("[Sidepanel] Submit attempted with empty email content");
      setError("Please enter email content");
      return;
    }

    console.log(
      "[Sidepanel] Submitting email for processing, content length:",
      emailContent.length
    );
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await axios.post<EventResponse>(
        "http://localhost:8000/api/email/process",
        {
          emailContent,
        }
      );
      console.log("[Sidepanel] Successfully processed email:", result.data);
      setResponse(result.data);
    } catch (err) {
      console.error("[Sidepanel] Error processing email:", err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error || err.message || "Failed to process email"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-4 bg-white">
      <h1 className="text-xl font-semibold text-center text-gray-800">
        Email Event Extractor
      </h1>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Email Content
          </label>
          <Button
            onClick={extractEmailFromPage}
            disabled={extracting}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {extracting ? "Extracting..." : "Refresh"}
          </Button>
        </div>
        <textarea
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
          placeholder={
            extracting
              ? "Extracting email content..."
              : "Email content will be extracted automatically from Gmail..."
          }
          className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={10}
          readOnly={extracting}
        />
        {extracting && (
          <p className="text-xs text-gray-500">
            Extracting email from Gmail...
          </p>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || extracting || !emailContent.trim()}
        className="w-full"
      >
        {loading ? "Processing..." : "Extract Event"}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {response && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
          <h2 className="font-semibold text-gray-800">Extracted Event:</h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Title:</span> {response.title}
            </p>
            <p>
              <span className="font-medium">Date:</span> {response.date}
            </p>
            {response.notes && (
              <p>
                <span className="font-medium">Notes:</span> {response.notes}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
