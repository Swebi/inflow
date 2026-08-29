import Avatar from "boring-avatars";
import { HeaderProps } from "@/types/schema";
import { BrandMark } from "@/components/BrandMark";

/**
 * Wordmark, greeting, avatar — nothing else. The avatar is the settings
 * entry point (and the app's one spot of personality); logout lives inside
 * the drawer, never here.
 */
export function Header({
  greeting,
  userName = "User",
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-3 px-gutter pb-3 pt-4">
      <BrandMark className="shrink-0" />
      <p className="type-body min-w-0 flex-1 truncate text-slate-600">
        {greeting}, {userName}
      </p>
      <button
        type="button"
        onClick={onOpenSettings}
        title="Settings"
        aria-label="Settings"
        className="shrink-0 overflow-hidden rounded-full shadow-sm outline-none ring-1 ring-slate-900/5 transition-shadow focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <Avatar name={userName} size={28} variant="beam" />
      </button>
    </header>
  );
}
