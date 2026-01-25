import Avatar from "boring-avatars";

interface HeaderProps {
  greeting: string;
  userName?: string;
}

export function Header({ greeting, userName = "User" }: HeaderProps) {
  return (
    <header className="px-5 pt-6 pb-4 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-slate-900">
        {greeting}
        <br />
        <span className="text-slate-700">{userName}</span>
      </h1>
      <div className="shadow-md rounded-full border-2 border-white">
        <Avatar name={userName} size={48} variant="beam" />
      </div>
    </header>
  );
}
