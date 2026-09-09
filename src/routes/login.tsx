import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Anwar Fresh" },
      {
        name: "description",
        content: "Sign in with your Anwar Group account to book today's milk batch.",
      },
      { property: "og:title", content: "Sign in — Anwar Fresh" },
      {
        property: "og:description",
        content: "Company sign-in for the Anwar Fresh milk ordering system.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { session, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/app", replace: true });
  }, [loading, session, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        toast.success("Welcome back");
        void navigate({ to: "/app", replace: true });
      } else {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          toast.success("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        } else {
          toast.success("Account created");
          void navigate({ to: "/app", replace: true });
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-8"
      >
        <Link to="/" className="font-display text-lg font-extrabold">
          Anwar Fresh
        </Link>
        <h1 className="mt-6 text-2xl font-bold">
          {mode === "signin" ? "Sign in to book your milk" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your Anwar Group company email address.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Company email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@anwargroup.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-5 text-sm text-primary-deep hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
        <p className="mt-5 text-xs text-muted-foreground">
          New accounts start as Employee. Ask a system administrator for operator, coordinator,
          finance or admin access.
        </p>
      </motion.div>
    </div>
  );
}
