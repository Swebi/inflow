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
    <div className="px-gutter pb-2">
      <h2 className="mb-2 flex items-baseline gap-1.5">
        <span className="type-label">Needs review</span>
        <span className="type-count">({actions.length})</span>
      </h2>
      <div className="space-y-stack">
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
