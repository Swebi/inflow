import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthScene } from "@/components/AuthScene";
import { Stepper, Step } from "@/components/Stepper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass =
  "bg-white/85 border-slate-200 text-[13px] text-slate-900 placeholder:text-slate-400 focus-visible:border-accent focus-visible:ring-accent/25";

export function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceed =
    step === 1
      ? name.trim().length > 0
      : step === 2
      ? EMAIL_RE.test(email)
      : password.length >= 8;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await register(email.trim(), password, name.trim());
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
      setBusy(false);
    }
  };

  return (
    <AuthScene>
      <div className="mb-4 text-center">
        <h1 className="font-heading text-[19px] font-semibold tracking-[-0.02em] text-slate-900">
          Create your account
        </h1>
        <p className="type-meta mt-1 text-slate-500">
          Already have one?{" "}
          <Link
            to="/signin"
            className="font-medium text-slate-700 no-underline hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <Stepper
        onStepChange={setStep}
        onComplete={submit}
        canProceed={canProceed}
        busy={busy}
        error={error}
        completeLabel="Create account"
      >
        <Step>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="type-meta">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              disabled={busy}
              className={inputClass}
            />
          </div>
        </Step>

        <Step>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="type-meta">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              disabled={busy}
              className={inputClass}
            />
          </div>
        </Step>

        <Step>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="type-meta">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              disabled={busy}
              className={inputClass}
            />
            <p className="type-meta text-slate-400">At least 8 characters.</p>
          </div>
        </Step>
      </Stepper>
    </AuthScene>
  );
}
