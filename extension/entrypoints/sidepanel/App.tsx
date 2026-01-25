import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { browser } from "wxt/browser";
import { Header } from "@/components/Header";
import { DateTimeCard } from "@/components/DateTimeCard";
import { EventsList } from "@/components/EventsList";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { EventEditDrawer } from "@/components/EventEditDrawer";
import {
  EventResponse,
  ProcessEmailResponse,
  ScannedEventResponse,
} from "@/types/schema";

function App() {
  const [emailContent, setEmailContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scannedEvents, setScannedEvents] = useState<
    ScannedEventResponse[] | null
  >(null);

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

  // Listen for email navigation changes from content script
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message?.action === "emailChanged") {
        console.log("[Sidepanel] Email changed detected, re-extracting...");
        extractEmailFromPage();
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [extractEmailFromPage]);

  // Listen for tab changes (when user switches to a different Gmail tab)
  useEffect(() => {
    const handleTabUpdate = async (
      tabId: number,
      changeInfo: any,
      tab: any
    ) => {
      // Only react to URL changes (navigation) or when tab becomes active
      if (changeInfo.url || changeInfo.status === "complete") {
        // Check if this is a Gmail tab
        if (tab.url?.includes("mail.google.com")) {
          console.log("[Sidepanel] Gmail tab updated, checking if we should re-extract...");
          // Get the current active tab to see if this is the one we're viewing
          const [activeTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
          });
          
          // Only re-extract if this updated tab is the active one
          if (activeTab.id === tabId) {
            console.log("[Sidepanel] Active Gmail tab updated, re-extracting email...");
            extractEmailFromPage();
          }
        }
      }
    };

    browser.tabs.onUpdated.addListener(handleTabUpdate);

    return () => {
      browser.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, [extractEmailFromPage]);

  // Listen for tab activation (when user switches tabs)
  useEffect(() => {
    const handleTabActivated = async (activeInfo: any) => {
      console.log("[Sidepanel] Tab activated:", activeInfo.tabId);
      // Get the tab details
      const tab = await browser.tabs.get(activeInfo.tabId);
      
      // If it's a Gmail tab, re-extract
      if (tab.url?.includes("mail.google.com")) {
        console.log("[Sidepanel] Switched to Gmail tab, re-extracting email...");
        extractEmailFromPage();
      }
    };

    browser.tabs.onActivated.addListener(handleTabActivated);

    return () => {
      browser.tabs.onActivated.removeListener(handleTabActivated);
    };
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
    setScannedEvents(null);

    try {
      const result = await axios.post<ProcessEmailResponse>(
        "http://localhost:8000/api/email/process",
        {
          emailContent,
        }
      );
      const { events } = result.data;
      console.log("[Sidepanel] Successfully processed email:", {
        count: events.length,
        events,
      });
      setScannedEvents(events);
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
    setScannedEvents(null);
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
      <DateTimeCard
        currentTime={currentTime}
        eventsCount={events.length}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
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
          if (!open) setScannedEvents(null);
        }}
        initialEvents={scannedEvents}
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
