import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format } from "date-fns";
import { browser } from "wxt/browser";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { DateTimeCard } from "@/components/DateTimeCard";
import { EventsList } from "@/components/EventsList";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { EventEditDrawer } from "@/components/EventEditDrawer";
import { GoogleConnectBanner } from "@/components/GoogleConnectBanner";
import {
  EventResponse,
  ProcessEmailResponse,
  RecentActionResponse,
  ScannedEventResponse,
} from "@/types/schema";
import { actionToEvent } from "@/utils/event";

const API_BASE_URL = "http://localhost:8000/api";

export function Dashboard() {
  const { user, token, logout, googleConnected } = useAuth();
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

  const fetchRecentActions = useCallback(async () => {
    if (!token) return;
    try {
      const result = await axios.get<{ data: RecentActionResponse[] }>(
        `${API_BASE_URL}/actions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvents(result.data.data.map(actionToEvent));
    } catch (err) {
      console.error("Failed to fetch recent actions", err);
    }
  }, [token]);

  // Recents is sourced entirely from the DB - hydrate on mount/login.
  useEffect(() => {
    fetchRecentActions();
  }, [fetchRecentActions]);

  const extractEmailFromPage = useCallback(async () => {
    console.log("[Sidepanel] Starting email extraction...");
    setExtracting(true);
    setError(null);

    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) throw new Error("Could not get active tab");

      // Content script only runs on Gmail; skip quietly elsewhere instead of
      // letting sendMessage throw "Receiving end does not exist".
      if (!tab.url?.includes("mail.google.com")) {
        setEmailContent("");
        return;
      }

      let response;
      try {
        response = await browser.tabs.sendMessage(tab.id, {
          action: "extractEmail",
        });
      } catch (sendError) {
        // The tab may have loaded before the content script attached (e.g.
        // it was already open when the extension installed/reloaded).
        // Inject it directly and retry once before giving up.
        const message =
          sendError instanceof Error ? sendError.message : String(sendError);
        if (!message.includes("Receiving end does not exist")) throw sendError;

        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content-scripts/content.js"],
        });
        response = await browser.tabs.sendMessage(tab.id, {
          action: "extractEmail",
        });
      }

      if (response?.success && response.content) {
        setEmailContent(response.content);
      } else {
        throw new Error(response?.error || "Failed to extract email content");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const message = errorMessage.includes("Receiving end does not exist")
        ? "Couldn't connect to the Gmail tab. Try refreshing it."
        : errorMessage;
      setError(
        message ||
          "Failed to extract email from page. Make sure you're viewing an email in Gmail."
      );
    } finally {
      setExtracting(false);
    }
  }, []);

  // Extract email content when sidepanel opens
  useEffect(() => {
    extractEmailFromPage();
  }, [extractEmailFromPage]);

  // Re-extract when the user navigates to a different email
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message?.action === "emailChanged") {
        extractEmailFromPage();
      }
    };
    browser.runtime.onMessage.addListener(handleMessage);
    return () => browser.runtime.onMessage.removeListener(handleMessage);
  }, [extractEmailFromPage]);

  // Re-extract when the active Gmail tab updates
  useEffect(() => {
    const handleTabUpdate = async (
      tabId: number,
      changeInfo: any,
      tab: any
    ) => {
      if (changeInfo.url || changeInfo.status === "complete") {
        if (tab.url?.includes("mail.google.com")) {
          const [activeTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (activeTab.id === tabId) {
            extractEmailFromPage();
          }
        }
      }
    };
    browser.tabs.onUpdated.addListener(handleTabUpdate);
    return () => browser.tabs.onUpdated.removeListener(handleTabUpdate);
  }, [extractEmailFromPage]);

  // Re-extract when the user switches to a Gmail tab
  useEffect(() => {
    const handleTabActivated = async (activeInfo: any) => {
      const tab = await browser.tabs.get(activeInfo.tabId);
      if (tab.url?.includes("mail.google.com")) {
        extractEmailFromPage();
      }
    };
    browser.tabs.onActivated.addListener(handleTabActivated);
    return () => browser.tabs.onActivated.removeListener(handleTabActivated);
  }, [extractEmailFromPage]);

  const handleSubmit = async () => {
    if (!emailContent.trim()) {
      setError("Please enter email content");
      return;
    }

    setLoading(true);
    setError(null);
    setScannedEvents(null);

    try {
      const result = await axios.post<ProcessEmailResponse>(
        `${API_BASE_URL}/email/process`,
        { emailContent },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setScannedEvents(result.data.data.events);
      setDrawerOpen(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to process email"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerSave = () => {
    setDrawerOpen(false);
    setScannedEvents(null);
    fetchRecentActions();
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Filter events by selected date when one is chosen
  const filteredEvents = selectedDate
    ? events.filter((e) => e.date === format(selectedDate, "dd.MM.yyyy"))
    : events;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        greeting={getGreeting()}
        userName={user?.name || user?.email || "User"}
        onLogout={logout}
      />
      <DateTimeCard
        currentTime={currentTime}
        eventsCount={filteredEvents.length}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      {!googleConnected && <GoogleConnectBanner />}
      <EventsList
        events={filteredEvents}
        error={error}
        extracting={extracting}
        showSuccess={false}
        selectedDate={selectedDate}
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
