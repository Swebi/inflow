import { useState } from "react";
import axios from "axios";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RecentActionResponse } from "@/types/schema";
import { humanizeKind } from "@/utils/event";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";

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
    <div className="rounded-2xl bg-white border border-amber-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-slate-900 truncate">
            {action.title}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {action.date ?? "No date"}
            {action.kind && (
              <span className="ml-1.5">· {humanizeKind(action.kind)}</span>
            )}
          </p>
          {action.notes && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              {action.notes}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={reject}
          disabled={busy !== null}
          aria-label="Reject"
          className="shrink-0 size-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
        >
          {busy === "reject" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 rounded-lg bg-red-50 px-3 py-2 mt-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => approve("CALENDAR_EVENT")}
          disabled={busy !== null}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 text-white text-sm font-medium py-2 hover:bg-slate-900 disabled:opacity-50"
        >
          {busy === "CALENDAR_EVENT" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <img src={calendarIcon} alt="" className="size-4" aria-hidden />
          )}
          Calendar
        </button>
        <button
          type="button"
          onClick={() => approve("TASK")}
          disabled={busy !== null}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-slate-800 text-sm font-medium py-2 hover:bg-slate-200 disabled:opacity-50"
        >
          {busy === "TASK" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <img src={tasksIcon} alt="" className="size-4" aria-hidden />
          )}
          Task
        </button>
      </div>
    </div>
  );
}
