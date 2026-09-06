import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/app-data";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Anwar Fresh" },
      { name: "description", content: "Sign in with your Anwar Group account to book today's milk batch." },
      { property: "og:title", content: "Sign in — Anwar Fresh" },
      { property: "og:description", content: "Company sign-in for the Anwar Fresh milk ordering system." },
    ],
  }),
  component: LoginPage,
});

const roles: Array<{ role: Role; to: string }> = [
  { role: "Employee", to: "/app/offer" },
  { role: "Factory Operator", to: "/app/operator" },
  { role: "Head Office Coordinator", to: "/app/orders" },
  { role: "Finance", to: "/app/collections" },
  { role: "System Admin", to: "/app/admin/employees" },
];

function LoginPage() {
  const { setRole } = useAppData();
  const navigate = useNavigate();

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
        <h1 className="mt-6 text-2xl font-bold">Sign in to book your milk</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your Anwar Group company account.
        </p>

        <div className="mt-6 space-y-3">
          <Button variant="outline" className="w-full justify-center" size="lg">
            Continue with Microsoft
          </Button>
          <Button variant="outline" className="w-full justify-center" size="lg">
            Continue with Google
          </Button>
        </div>

        <div className="my-7 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Preview a role
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-2">
          {roles.map(({ role, to }) => (
            <button
              key={role}
              onClick={() => {
                setRole(role);
                navigate({ to });
              }}
              className="rounded-md border border-border bg-background px-4 py-2.5 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-secondary"
            >
              {role}
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          Demo preview — no real account is created and nothing is charged.
        </p>
      </motion.div>
    </div>
  );
}
