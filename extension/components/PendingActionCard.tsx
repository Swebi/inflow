import { useState } from "react";
import axios from "axios";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RecentActionResponse } from "@/types/schema";
import { formatHumanDate, kindLabel } from "@/utils/event";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { outlineButton, outlineButtonCompact } from "@/lib/styles";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";

const actionButton = cn(outlineButton, outlineButtonCompact, "flex-1");

const API_BASE_URL = "http://localhost:8000/api";

interface PendingActionCardProps {
  action: RecentActionResponse;
  onResolved: () => void;
}

type Busy = "CALENDAR_EVENT" | "TASK" | "reject" | null;

export function PendingActionCard({ action, onResolved }: PendingActionCardProps) {
  const { token } = useAuth();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const approve = async (destination: "CALENDAR_EVENT" | "TASK") => {
    setBusy(destination);
    setError(null);
    try {
      await axios.post(
        `${API_BASE_URL}/actions/${action.id}/approve`,
        { destination },
        { headers }
      );
      onResolved();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to approve"
          : "Failed to approve"
      );
      setBusy(null);
    }
  };

  const reject = async () => {
    setBusy("reject");
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/actions/${action.id}/reject`, {}, { headers });
      onResolved();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to reject"
          : "Failed to reject"
      );
      setBusy(null);
    }
  };

  return (
    <div className="surface-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="type-item-title line-clamp-2">{action.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="type-meta">{formatHumanDate(action.date)}</span>
            {action.kind && <Badge>{kindLabel(action.kind)}</Badge>}
          </div>
          {action.notes && (
            <p className="type-body mt-1 line-clamp-1 text-slate-400">
              {action.notes}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={reject}
          disabled={busy !== null}
          aria-label="Reject"
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
        >
          {busy === "reject" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <X className="size-3.5" />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2.5 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
          {error}
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => approve("CALENDAR_EVENT")}
          disabled={busy !== null}
          className={actionButton}
        >
          {busy === "CALENDAR_EVENT" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <img src={calendarIcon} alt="" className="size-3.5" aria-hidden />
          )}
          Calendar
        </button>
        <button
          type="button"
          onClick={() => approve("TASK")}
          disabled={busy !== null}
          className={actionButton}
        >
          {busy === "TASK" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <img src={tasksIcon} alt="" className="size-3.5" aria-hidden />
          )}
          Task
        </button>
      </div>
    </div>
  );
}
