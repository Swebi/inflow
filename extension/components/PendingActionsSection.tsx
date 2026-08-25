import { RecentActionResponse } from "@/types/schema";
import { PendingActionCard } from "./PendingActionCard";

interface PendingActionsSectionProps {
  actions: RecentActionResponse[];
  onResolved: () => void;
}

export function PendingActionsSection({
  actions,
  onResolved,
}: PendingActionsSectionProps) {
  if (actions.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <h2 className="text-sm font-semibold text-slate-700 mb-2">
        Needs review
        <span className="ml-1.5 text-slate-400 font-normal">
          ({actions.length})
        </span>
      </h2>
      <div className="space-y-3">
        {actions.map((action) => (
          <PendingActionCard
            key={action.id}
            action={action}
            onResolved={onResolved}
          />
        ))}
      </div>
    </div>
  );
}
