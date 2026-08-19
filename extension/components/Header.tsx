import Avatar from "boring-avatars";
import { LogOut } from "lucide-react";
import { HeaderProps } from "@/types/schema";
import { Button } from "@/components/ui/button";

export function Header({ greeting, userName = "User", onLogout }: HeaderProps) {
  return (
    <header className="px-5 pt-6 pb-4 flex items-center justify-between">
      <h1 className="text-2xl font-light text-slate-900">
        {greeting}
        <br />
        <span className="text-slate-900 font-semibold">{userName}</span>
      </h1>
      <div className="flex items-center gap-3">
        {onLogout && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            title="Logout"
            className="h-9 w-9"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
        <div className="shadow-md rounded-full border-2 border-white">
          <Avatar name={userName} size={48} variant="beam" />
        </div>
      </div>
    </header>
  );
}
