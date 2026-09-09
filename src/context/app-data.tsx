import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as api from "@/lib/api";
import type { AppSettings, BatchStats, NewBatchInput, Snapshot } from "@/lib/api";
import { useAuth } from "@/context/auth";
import type {
  AppNotification,
  AuditLog,
  BatchStatus,
  CollectionRecord,
  DailyMilkBatch,
  DeliveryPoint,
  DeliveryRecord,
  Employee,
  Order,
  OrderStatus,
  Role,
} from "@/lib/types";

const EMPTY: Snapshot = {
  employees: [],
  batches: [],
  deliveryPoints: [],
  orders: [],
  deliveryRecords: [],
  collections: [],
  auditLogs: [],
  notifications: [],
  settings: null,
  batchStats: [],
};

const FALLBACK_EMPLOYEE: Employee = {
  id: "—",
  name: "Your account",
  companyEmail: "",
  phone: "",
  department: "Admin",
  site: "Head Office – Gulshan",
  active: true,
};

interface AppData {
  loading: boolean;
  role: Role;
  roles: Role[];
  setRole: (r: Role) => void;
  currentEmployee: Employee;
  isLinkedEmployee: boolean;
  employees: Employee[];
  batches: DailyMilkBatch[];
  activeBatch: DailyMilkBatch | undefined;
  deliveryPoints: DeliveryPoint[];
  orders: Order[];
  deliveryRecords: DeliveryRecord[];
  collections: CollectionRecord[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  batchStats: BatchStats[];
  settings: AppSettings | null;
  unreadCount: number;
  refresh: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  remainingLitres: (batchNo: string) => number;
  setBatchStatus: (batchNo: string, status: BatchStatus) => Promise<void>;
  addBatch: (input: NewBatchInput) => Promise<DailyMilkBatch>;
  confirmOrder: (input: {
    batchNo: string;
    litres: number;
    deliveryPointId: string;
  }) => Promise<Order>;
  cancelOrder: (orderNo: string, reason: string) => Promise<void>;
  adjustOrder: (orderNo: string, litres: number, reason: string) => Promise<void>;
  setOrderStatus: (
    orderNo: string,
    status: OrderStatus,
    receiverName?: string,
    remarks?: string,
  ) => Promise<void>;
  recordCollection: (input: {
    orderNo: string;
    amountCollected: number;
    method: NonNullable<CollectionRecord["method"]>;
    reference: string;
  }) => Promise<void>;
  upsertEmployee: (employee: Employee) => Promise<void>;
  setEmployeeActive: (id: string, active: boolean) => Promise<void>;
  upsertDeliveryPoint: (point: DeliveryPoint) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
}

const Ctx = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { session, employee, role, roles, setActiveRole, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const signedIn = !!session;

  const query = useQuery({
    queryKey: ["snapshot", session?.user.id ?? "anon"],
    queryFn: api.fetchSnapshot,
    enabled: signedIn,
    staleTime: 15_000,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["snapshot"] });
  }, [queryClient]);

  // Live updates: any change to the core tables refreshes the workspace.
  useEffect(() => {
    if (!signedIn) return;
    const channel = supabase
      .channel("anwar-fresh-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "collections" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => void refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [signedIn, refresh]);

  const data = query.data ?? EMPTY;

  const remainingLitres = useCallback(
    (batchNo: string) => {
      const stats = data.batchStats.find((s) => s.batch_no === batchNo);
      if (stats?.remaining_litres != null) return stats.remaining_litres;
      const batch = data.batches.find((b) => b.batchNo === batchNo);
      if (!batch) return 0;
      const booked = data.orders
        .filter((o) => o.batchNo === batchNo && o.status !== "Cancelled")
        .reduce((sum, o) => sum + o.litres, 0);
      return Math.max(0, batch.saleableLitres - booked);
    },
    [data],
  );

  const run = useCallback(
    async <T,>(fn: () => Promise<T>) => {
      const result = await fn();
      await refresh();
      return result;
    },
    [refresh],
  );

  const value = useMemo<AppData>(() => {
    return {
      loading: query.isLoading,
      role,
      roles,
      setRole: setActiveRole,
      currentEmployee: employee ?? FALLBACK_EMPLOYEE,
      isLinkedEmployee: !!employee,
      employees: data.employees,
      batches: data.batches,
      activeBatch: data.batches.find(
        (b) => b.status === "Active" || b.status === "Paused" || b.status === "SoldOut",
      ),
      deliveryPoints: data.deliveryPoints,
      orders: data.orders,
      deliveryRecords: data.deliveryRecords,
      collections: data.collections,
      auditLogs: data.auditLogs,
      notifications: data.notifications,
      batchStats: data.batchStats,
      settings: data.settings,
      unreadCount: data.notifications.filter((n) => !n.read).length,
      refresh,
      remainingLitres,
      markNotificationsRead: () => run(api.markNotificationsRead).then(() => undefined),
      setBatchStatus: (batchNo, status) =>
        run(() => api.setBatchStatus(batchNo, status)).then(() => undefined),
      addBatch: (input) => run(() => api.createBatch(input)),
      confirmOrder: (input) => run(() => api.confirmOrder(input)),
      cancelOrder: (orderNo, reason) =>
        run(() => api.cancelOrder(orderNo, reason)).then(() => undefined),
      adjustOrder: (orderNo, litres, reason) =>
        run(() => api.adjustOrder(orderNo, litres, reason)).then(() => undefined),
      setOrderStatus: (orderNo, status, receiverName, remarks) =>
        run(() => api.setOrderStatus(orderNo, status, receiverName, remarks)).then(() => undefined),
      recordCollection: (input) => run(() => api.recordCollection(input)).then(() => undefined),
      upsertEmployee: (emp) =>
        run(async () => {
          await api.upsertEmployee(emp);
          await refreshProfile().catch(() => undefined);
        }).then(() => undefined),
      setEmployeeActive: (id, active) =>
        run(() => api.setEmployeeActive(id, active)).then(() => undefined),
      upsertDeliveryPoint: (point) =>
        run(() => api.upsertDeliveryPoint(point)).then(() => undefined),
      saveSettings: (settings) => run(() => api.saveSettings(settings)).then(() => undefined),
    };
  }, [query.isLoading, role, roles, setActiveRole, employee, data, refresh, remainingLitres, run, refreshProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
