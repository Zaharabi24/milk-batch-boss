import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  activeBatch as seedActiveBatch,
  auditLogs as seedAudit,
  batches as seedBatches,
  collections as seedCollections,
  deliveryPoints as seedPoints,
  deliveryRecords as seedDeliveries,
  employees as seedEmployees,
  orders as seedOrders,
} from "@/lib/mock-data";
import type {
  AuditLog,
  BatchStatus,
  CollectionRecord,
  DailyMilkBatch,
  DeliveryPoint,
  DeliveryRecord,
  Employee,
  Order,
  Role,
} from "@/lib/types";

interface AppData {
  role: Role;
  setRole: (r: Role) => void;
  currentEmployee: Employee;
  employees: Employee[];
  batches: DailyMilkBatch[];
  activeBatch: DailyMilkBatch | undefined;
  deliveryPoints: DeliveryPoint[];
  orders: Order[];
  deliveryRecords: DeliveryRecord[];
  collections: CollectionRecord[];
  auditLogs: AuditLog[];
  remainingLitres: (batchNo: string) => number;
  addAudit: (entry: Omit<AuditLog, "id" | "timestamp">) => void;
  setBatchStatus: (batchNo: string, status: BatchStatus) => void;
  addBatch: (batch: DailyMilkBatch) => void;
  confirmOrder: (input: {
    employeeId: string;
    batchNo: string;
    litres: number;
    deliveryPointId: string;
  }) => Order | null;
  cancelOrder: (orderNo: string, reason: string) => void;
  updateOrder: (orderNo: string, patch: Partial<Order>, reason: string) => void;
  addDeliveryRecord: (record: DeliveryRecord) => void;
  upsertCollection: (record: CollectionRecord) => void;
  setEmployees: (list: Employee[]) => void;
  setDeliveryPoints: (list: DeliveryPoint[]) => void;
}

const Ctx = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("Employee");
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [batches, setBatches] = useState<DailyMilkBatch[]>(seedBatches);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>(seedPoints);
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [deliveryRecords, setDeliveryRecords] = useState<DeliveryRecord[]>(seedDeliveries);
  const [collections, setCollections] = useState<CollectionRecord[]>(seedCollections);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seedAudit);

  const currentEmployee = employees[0];

  const addAudit = useCallback((entry: Omit<AuditLog, "id" | "timestamp">) => {
    setAuditLogs((prev) => [
      { ...entry, id: `AL-${Date.now()}`, timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const remainingLitres = useCallback(
    (batchNo: string) => {
      const batch = batches.find((b) => b.batchNo === batchNo) ?? seedActiveBatch;
      const booked = orders
        .filter((o) => o.batchNo === batchNo && o.status !== "Cancelled")
        .reduce((sum, o) => sum + o.litres, 0);
      return Math.max(0, batch.saleableLitres - booked);
    },
    [batches, orders],
  );

  const setBatchStatus = useCallback(
    (batchNo: string, status: BatchStatus) => {
      setBatches((prev) =>
        prev.map((b) => {
          if (b.batchNo !== batchNo) return b;
          addAudit({
            user: role,
            action: "Changed batch status",
            record: batchNo,
            oldValue: b.status,
            newValue: status,
          });
          return { ...b, status };
        }),
      );
    },
    [addAudit, role],
  );

  const addBatch = useCallback(
    (batch: DailyMilkBatch) => {
      setBatches((prev) => [batch, ...prev]);
      addAudit({
        user: role,
        action: "Created batch",
        record: batch.batchNo,
        oldValue: "—",
        newValue: "Draft",
      });
    },
    [addAudit, role],
  );

  const confirmOrder: AppData["confirmOrder"] = useCallback(
    ({ employeeId, batchNo, litres, deliveryPointId }) => {
      const batch = batches.find((b) => b.batchNo === batchNo);
      if (!batch || batch.status !== "Active") return null;
      if (remainingLitres(batchNo) < litres) return null;
      const existing = orders.find(
        (o) => o.employeeId === employeeId && o.batchNo === batchNo && o.status !== "Cancelled",
      );
      if (existing) return null;
      const order: Order = {
        orderNo: `ORD-${8800 + orders.length + 1}`,
        employeeId,
        batchNo,
        litres,
        rate: batch.ratePerLitre,
        amount: litres * batch.ratePerLitre,
        deliveryPointId,
        status: "Confirmed",
        createdAt: new Date().toISOString(),
      };
      setOrders((prev) => [order, ...prev]);
      addAudit({
        user: employeeId,
        action: "Confirmed order",
        record: order.orderNo,
        oldValue: "—",
        newValue: `${litres} L`,
      });
      return order;
    },
    [addAudit, batches, orders, remainingLitres],
  );

  const cancelOrder = useCallback(
    (orderNo: string, reason: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.orderNo === orderNo ? { ...o, status: "Cancelled" as const } : o)),
      );
      addAudit({
        user: role,
        action: `Cancelled order — ${reason}`,
        record: orderNo,
        oldValue: "Confirmed",
        newValue: "Cancelled",
      });
    },
    [addAudit, role],
  );

  const updateOrder = useCallback(
    (orderNo: string, patch: Partial<Order>, reason: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.orderNo !== orderNo) return o;
          const next = { ...o, ...patch };
          next.amount = next.litres * next.rate;
          addAudit({
            user: role,
            action: `Adjusted order — ${reason}`,
            record: orderNo,
            oldValue: `${o.litres} L / ${o.status}`,
            newValue: `${next.litres} L / ${next.status}`,
          });
          return next;
        }),
      );
    },
    [addAudit, role],
  );

  const addDeliveryRecord = useCallback((record: DeliveryRecord) => {
    setDeliveryRecords((prev) => [record, ...prev]);
  }, []);

  const upsertCollection = useCallback((record: CollectionRecord) => {
    setCollections((prev) => [record, ...prev.filter((c) => c.orderNo !== record.orderNo)]);
  }, []);

  const value = useMemo<AppData>(
    () => ({
      role,
      setRole,
      currentEmployee,
      employees,
      batches,
      activeBatch: batches.find((b) => b.status === "Active" || b.status === "Paused"),
      deliveryPoints,
      orders,
      deliveryRecords,
      collections,
      auditLogs,
      remainingLitres,
      addAudit,
      setBatchStatus,
      addBatch,
      confirmOrder,
      cancelOrder,
      updateOrder,
      addDeliveryRecord,
      upsertCollection,
      setEmployees,
      setDeliveryPoints,
    }),
    [
      role,
      currentEmployee,
      employees,
      batches,
      deliveryPoints,
      orders,
      deliveryRecords,
      collections,
      auditLogs,
      remainingLitres,
      addAudit,
      setBatchStatus,
      addBatch,
      confirmOrder,
      cancelOrder,
      updateOrder,
      addDeliveryRecord,
      upsertCollection,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
