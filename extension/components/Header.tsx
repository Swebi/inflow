import Avatar from "boring-avatars";
import { HeaderProps } from "@/types/schema";
import { BrandMark } from "@/components/BrandMark";

export function Header({
  greeting,
  userName = "User",
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-2.5 px-4 pb-3 pt-4">
      <BrandMark className="shrink-0" />
      <span className="h-4 w-px shrink-0 bg-slate-200" aria-hidden="true" />
      <h1 className="type-meta min-w-0 flex-1 truncate">
        {greeting}, {userName}
      </h1>
      <button
        type="button"
        onClick={onOpenSettings}
        title="Settings"
        aria-label="Settings"
        className="shrink-0 rounded-full border-2 border-white shadow-md"
      >
        <Avatar name={userName} size={30} variant="beam" />
      </button>
    </header>
  );
}
