import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import calendarIcon from "@/assets/calendar.svg";

export function GoogleConnectBanner() {
  const { connectGoogle } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await connectGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <img src={calendarIcon} alt="" className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">
            Connect Google Calendar &amp; Tasks
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Required to save events and tasks from your emails.
          </p>
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleConnect}
          disabled={connecting}
          className="shrink-0 bg-slate-800 text-white hover:bg-slate-900 text-xs"
        >
          {connecting ? "Opening…" : "Connect"}
        </Button>
      </div>
    </div>
  );
}
