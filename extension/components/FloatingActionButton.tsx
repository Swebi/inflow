import { FloatingActionButtonProps } from "@/types/schema";

export function FloatingActionButton({
  onClick,
  disabled,
  loading,
}: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-6 right-6">
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-14 h-14 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        {loading ? (
          <svg
            className="w-6 h-6 text-white animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
