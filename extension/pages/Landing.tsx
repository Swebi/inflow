import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthScene } from "@/components/AuthScene";
import { Button } from "@/components/ui/button";

/**
 * Unauthenticated entry screen. A signed-out user landing on `/` is sent
 * here and steps into sign in / create account from the CTA.
 *
 * The wordmark, background and glass "Works with" footer all come from
 * AuthScene (shared with Sign in / Sign up); this file is just the hero
 * copy + CTA, which sit directly on the open background with no container.
 */
export function Landing() {
  const { isAuthenticated, loading } = useAuth();

  // A returning user with a live session skips the pitch.
  if (!loading && isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthScene worksWith>
      <h1 className="font-heading text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-slate-900">
        Never miss what's
        <br />
        buried in your inbox.
      </h1>
      <p className="type-body mt-3 max-w-[36ch] text-slate-600">
        Your inbox has a to-do list — Inflow's agentic layer finds it, drafts
        the calendar event or task, and waits for your yes before anything goes
        anywhere.
      </p>

      <div className="mt-7 flex flex-col items-start gap-3">
        <Button
          asChild
          className="rounded-full bg-accent px-12 text-accent-foreground hover:bg-accent/90"
        >
          <Link to="/signup">Get started</Link>
        </Button>
        <p className="type-meta ml-1 text-slate-500">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-medium text-slate-700 no-underline hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthScene>
  );
}
