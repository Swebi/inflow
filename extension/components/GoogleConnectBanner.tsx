import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

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
    <div className="mx-4 mb-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <CalendarClock className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
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
          variant="outline"
          onClick={handleConnect}
          disabled={connecting}
          className="shrink-0 text-xs"
        >
          {connecting ? "Opening…" : "Connect"}
        </Button>
      </div>
    </div>
  );
}
