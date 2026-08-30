import Avatar from "boring-avatars";
import { HeaderProps } from "@/types/schema";

/**
 * Greeting + avatar, nothing else. The colored avatar is the app's identity
 * anchor and the settings entry point (logout lives inside the drawer, never
 * here); the extension already carries its icon in the browser chrome, so no
 * in-panel wordmark.
 */
export function Header({
  greeting,
  userName = "User",
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-3 px-gutter pb-3.5 pt-5">
      <p className="type-body min-w-0 flex-1 truncate text-[14.5px] text-slate-600">
        {greeting}, {userName}
      </p>
      <button
        type="button"
        onClick={onOpenSettings}
        title="Settings"
        aria-label="Settings"
        className="shrink-0 overflow-hidden rounded-full shadow-sm outline-none ring-1 ring-slate-900/5 transition-shadow focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <Avatar name={userName} size={32} variant="beam" />
      </button>
    </header>
  );
}
