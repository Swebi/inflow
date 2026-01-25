import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { browser } from "wxt/browser";
import { Header } from "@/components/Header";
import { DateTimeCard } from "@/components/DateTimeCard";
import { EventsList } from "@/components/EventsList";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { EventEditDrawer } from "@/components/EventEditDrawer";
import { EventResponse, ScannedEventResponse } from "@/components/types";

function App() {
  const [emailContent, setEmailContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scannedEvent, setScannedEvent] = useState<ScannedEventResponse | null>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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


      console.log(
        "[Sidepanel] On Gmail, sending extract message to content script..."
      );

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
    setScannedEvent(null);

    try {
      const result = await axios.post<ScannedEventResponse>(
        "http://localhost:8000/api/email/process",
        {
          emailContent,
        }
      );
      console.log("[Sidepanel] Successfully processed email:", result.data);
      setScannedEvent(result.data);
      setDrawerOpen(true);
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

  const handleDrawerSave = (event: EventResponse) => {
    setEvents((prev) => [event, ...prev]);
    setDrawerOpen(false);
    setScannedEvent(null);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header greeting={getGreeting()} userName="Suhayb" />
      <DateTimeCard currentTime={currentTime} eventsCount={events.length} />
      <EventsList
        events={events}
        error={error}
        extracting={extracting}
        showSuccess={false}
      />
      <EventEditDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setScannedEvent(null);
        }}
        initialData={scannedEvent}
        onSave={handleDrawerSave}
      />
      <FloatingActionButton
        onClick={handleSubmit}
        disabled={loading || extracting || !emailContent.trim()}
        loading={loading}
      />
    </div>
  );
}

export default App;
