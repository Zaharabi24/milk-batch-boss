import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/app-data";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

type NavItem = { label: string; to: string };

const navByRole: Record<Role, NavItem[]> = {
  Employee: [
    { label: "Today's offer", to: "/app/offer" },
    { label: "Book milk", to: "/app/order/new" },
    { label: "My orders", to: "/app/my-orders" },
  ],
  "Factory Operator": [
    { label: "Operator dashboard", to: "/app/operator" },
    { label: "New batch", to: "/app/operator/new-batch" },
    { label: "Review & publish", to: "/app/operator/publish" },
    { label: "Reports", to: "/app/reports" },
  ],
  "Head Office Coordinator": [
    { label: "Orders", to: "/app/orders" },
    { label: "Fulfillment", to: "/app/fulfillment" },
  ],
  Finance: [
    { label: "Collections", to: "/app/collections" },
    { label: "Reports", to: "/app/reports" },
  ],
  "System Admin": [
    { label: "Employees", to: "/app/admin/employees" },
    { label: "Delivery points", to: "/app/admin/delivery-points" },
    { label: "Settings", to: "/app/admin/settings" },
    { label: "Audit log", to: "/app/admin/audit-log" },
    { label: "Reports", to: "/app/reports" },
  ],
};

const allRoles = Object.keys(navByRole) as Role[];

function AppShell() {
  const { role, setRole } = useAppData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = navByRole[role];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
        <Link to="/" className="px-2 font-display text-lg font-extrabold">
          Anwar Fresh
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:font-medium data-[status=active]:text-primary-deep"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-5">
          <span className="rounded-md bg-secondary px-3 py-1 text-sm font-medium text-primary-deep">
            {role}
          </span>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Switch role <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Demo control — switch freely</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allRoles.map((r) => (
                  <DropdownMenuItem key={r} onSelect={() => setRole(r)}>
                    {r}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="size-5" />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-5 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
