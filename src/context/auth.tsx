import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyContext } from "@/lib/api";
import type { Employee, Role } from "@/lib/types";

const ROLE_PRIORITY: Role[] = [
  "System Admin",
  "Finance",
  "Head Office Coordinator",
  "Factory Operator",
  "Employee",
];

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  employee: Employee | null;
  roles: Role[];
  role: Role;
  activeRole: Role;
  setActiveRole: (r: Role) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeRole, setActiveRole] = useState<Role | null>(null);

  async function loadProfile() {
    const ctx = await fetchMyContext();
    setEmployee(ctx.employee);
    setRoles(ctx.roles);
    setActiveRole((current) => (current && ctx.roles.includes(current) ? current : (ctx.roles[0] ?? "Employee")));
  }

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) {
        try {
          await loadProfile();
        } catch {
          /* profile fetch failures show as an empty workspace */
        }
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setSession(next);
      if (event === "SIGNED_OUT") {
        setEmployee(null);
        setRoles([]);
        setActiveRole(null);
        return;
      }
      void loadProfile().catch(() => undefined);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const primary = useMemo(() => {
    const found = ROLE_PRIORITY.find((r) => roles.includes(r));
    return found ?? "Employee";
  }, [roles]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      employee,
      roles,
      role: activeRole ?? primary,
      activeRole: activeRole ?? primary,
      setActiveRole: (r) => setActiveRole(r),
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw new Error(error.message);
      },
      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw new Error(error.message);
        return { needsConfirmation: !data.session };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refreshProfile: async () => {
        await loadProfile();
      },
    }),
    [loading, session, employee, roles, activeRole, primary],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
