import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="mx-gutter mb-section surface-card p-card">
      <div className="flex items-start gap-3">
        <CalendarClock
          className="mt-0.5 size-4 shrink-0 text-slate-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="type-item-title">Connect Google Calendar &amp; Tasks</p>
          <p className="type-body mt-0.5">
            Required to save events and tasks from your emails.
          </p>
          {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
        </div>
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-accent px-3 text-[12.5px] font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-40"
        >
          {connecting ? "Opening…" : "Connect"}
        </button>
      </div>
    </div>
  );
}
