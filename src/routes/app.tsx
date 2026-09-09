import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/app-data";
import { timeShort } from "@/lib/format";
import logoAsset from "@/assets/anwar-organic-logo.png.asset.json";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

type NavItem = { label: string; to: string };

const commonTail: NavItem[] = [{ label: "Notifications", to: "/app/notifications" }];

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
    { label: "Delivery coupons", to: "/app/coupons" },
  ],
  Finance: [
    { label: "Collections", to: "/app/collections" },
    { label: "Delivery coupons", to: "/app/coupons" },
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

const linkClass =
  "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:font-medium data-[status=active]:text-primary-deep";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 px-2">
      <img src={logoAsset.url} alt="Anwar Organic" width={40} height={40} className="h-10 w-auto" />
      <span className="font-display text-lg font-extrabold">Anwar Fresh</span>
    </Link>
  );
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      <Link to="/app" className={linkClass} onClick={onNavigate}>
        Home
      </Link>
      {[...items, ...commonTail].map((item) => (
        <Link key={item.to} to={item.to} className={linkClass} onClick={onNavigate}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function AppShell() {
  const { role, setRole, notifications, unreadCount, markNotificationsRead } = useAppData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = navByRole[role];
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
        <Brand />
        <div className="mt-8">
          <NavLinks items={items} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar px-4 py-6">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand />
                <div className="mt-8">
                  <NavLinks items={items} onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="truncate rounded-md bg-secondary px-3 py-1 text-sm font-medium text-primary-deep">
              {role}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <span className="hidden sm:inline">Switch role</span>
                  <span className="sm:hidden">Role</span>
                  <ChevronDown className="size-4" />
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                  className="relative"
                >
                  <Bell className="size-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary-deep hover:underline"
                      onClick={markNotificationsRead}
                    >
                      Mark all read
                    </button>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="px-2 py-2">
                    <p className="flex items-start justify-between gap-2 text-sm font-medium">
                      <span>{n.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeShort(n.timestamp)}
                      </span>
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  </div>
                ))}
                {notifications.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                    Nothing yet
                  </p>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/notifications">View all notifications</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-5">
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
