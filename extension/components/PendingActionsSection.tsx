import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { RecentActionResponse } from "@/types/schema";
import { ScrollStack, ScrollStackItem } from "./ScrollStack";
import { PendingActionCard } from "./PendingActionCard";
import { PendingReviewModal } from "./PendingReviewModal";

const API_BASE_URL = "http://localhost:8000/api";

interface PendingActionsSectionProps {
  actions: RecentActionResponse[];
  onResolved: () => void;
}

/**
 * "Needs review" — the pending-suggestion queue.
 *
 * A scroll-driven card stack (3+ items) or a plain list (1–2). Tapping a card
 * opens the swipeable detail sheet — where the tactile review interaction
 * lives; the small X on a card dismisses it. The resolved-history tabs below
 * stay plain lists.
 *
 * Resolving an item (skip / calendar / task) removes it from the list
 * immediately — before the request settles — so the card leaves and the ones
 * below slide up right away; a failure puts it back. The API calls live here
 * rather than in the card so one busy / error state covers whichever item is
 * open.
 */
export function PendingActionsSection({
  actions,
  onResolved,
}: PendingActionsSectionProps) {
  const { token } = useAuth();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const visible = actions.filter((a) => !dismissed.has(a.id));
  const open = visible.find((a) => a.id === openId) ?? null;

  // Drop ids from the optimistic set once the refetched list no longer has
  // them (or if they somehow reappear).
  useEffect(() => {
    setDismissed((prev) => {
      if (prev.size === 0) return prev;
      const ids = new Set(actions.map((a) => a.id));
      const next = new Set<string>();
      prev.forEach((id) => ids.has(id) && next.add(id));
      return next.size === prev.size ? prev : next;
    });
  }, [actions]);

  const resolve = (
    id: string,
    request: Promise<unknown>,
    failMessage: string
  ) => {
    setDismissed((s) => new Set(s).add(id));
    setBusy(true);
    setError(null);
    request
      .then(() => {
        setOpenId(null);
        onResolved();
      })
      .catch((err) => {
        setDismissed((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message || failMessage
            : failMessage
        );
      })
      .finally(() => setBusy(false));
  };

  const approve = (id: string, destination: "CALENDAR_EVENT" | "TASK") =>
    resolve(
      id,
      axios.post(
        `${API_BASE_URL}/actions/${id}/approve`,
        { destination },
        { headers }
      ),
      "Failed to approve"
    );

  const reject = (id: string) =>
    resolve(
      id,
      axios.post(`${API_BASE_URL}/actions/${id}/reject`, {}, { headers }),
      "Failed to skip"
    );

  if (visible.length === 0) return null;

  return (
    <section className="mb-3">
      <h2 className="mb-1 flex items-baseline gap-1.5 px-gutter">
        <span className="type-label">Needs review</span>
        <span className="type-count">({visible.length})</span>
      </h2>

      {visible.length < 3 ? (
        <div className="flex flex-col gap-2.5 overflow-x-clip px-gutter">
          {visible.map((action) => (
            <PendingActionCard
              key={action.id}
              action={action}
              onOpen={() => setOpenId(action.id)}
              onDismiss={() => reject(action.id)}
            />
          ))}
        </div>
      ) : (
        <div className="px-gutter" style={{ height: "min(300px, 44vh)" }}>
          {/* ~2.5 cards tall — the rest of the panel is for the history tabs
              below; the vh cap keeps it from dominating a short panel. */}
          <ScrollStack>
            {visible.map((action) => (
              <ScrollStackItem key={action.id}>
                <PendingActionCard
                  action={action}
                  onOpen={() => setOpenId(action.id)}
                  onDismiss={() => reject(action.id)}
                />
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      )}

      <PendingReviewModal
        action={open}
        busy={busy}
        error={error}
        onClose={() => {
          setOpenId(null);
          setError(null);
        }}
        onSkip={() => open && reject(open.id)}
        onCalendar={() => open && approve(open.id, "CALENDAR_EVENT")}
        onTask={() => open && approve(open.id, "TASK")}
      />
    </section>
  );
}
