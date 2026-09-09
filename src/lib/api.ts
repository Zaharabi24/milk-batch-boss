import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  AppNotification,
  AuditLog,
  BatchStatus,
  CollectionRecord,
  DailyMilkBatch,
  Department,
  DeliveryPoint,
  DeliveryRecord,
  Employee,
  Order,
  OrderStatus,
  Role,
  Site,
} from "@/lib/types";

type Tables = Database["public"]["Tables"];
type EmployeeRow = Tables["employees"]["Row"];
type BatchRow = Tables["batches"]["Row"];
type PointRow = Tables["delivery_points"]["Row"];
type OrderRow = Tables["orders"]["Row"];
type CouponRow = Tables["delivery_records"]["Row"];
type CollectionRow = Tables["collections"]["Row"];
type AuditRow = Tables["audit_log"]["Row"];
type NotificationRow = Tables["notifications"]["Row"];
export type SettingsRow = Tables["app_settings"]["Row"];
export type BatchStats = Database["public"]["Views"]["batch_stats"]["Row"];

export interface AppSettings {
  defaultRate: number;
  defaultCutoff: string;
  defaultEmployeeCap: number;
  defaultMinOrder: number;
  defaultMaxOrder: number;
  defaultDeliveryWindow: string;
  emailOnPublish: boolean;
  smsBeforeCutoff: boolean;
  autoCloseAtCutoff: boolean;
  terms: string;
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const mapEmployee = (r: EmployeeRow): Employee => ({
  id: r.id,
  name: r.name,
  companyEmail: r.company_email,
  phone: r.phone,
  department: r.department as Department,
  site: r.site as Site,
  active: r.active,
});

export const mapBatch = (r: BatchRow): DailyMilkBatch => ({
  batchNo: r.batch_no,
  productionDate: r.production_date,
  product: r.product,
  producedLitres: r.produced_litres,
  saleableLitres: r.saleable_litres,
  ratePerLitre: Number(r.rate_per_litre),
  minOrder: r.min_order,
  maxOrder: r.max_order,
  employeeCap: r.employee_cap,
  bookingCutoff: r.booking_cutoff,
  deliveryDate: r.delivery_date,
  deliveryWindow: r.delivery_window,
  deliveryPoints: r.delivery_points,
  note: r.note,
  status: r.status as BatchStatus,
});

export const mapPoint = (r: PointRow): DeliveryPoint => ({
  id: r.id,
  name: r.name,
  address: r.address,
  coordinatorName: r.coordinator_name,
  active: r.active,
});

export const mapOrder = (r: OrderRow): Order => ({
  orderNo: r.order_no,
  employeeId: r.employee_id,
  batchNo: r.batch_no,
  litres: r.litres,
  rate: Number(r.rate),
  amount: Number(r.amount ?? r.litres * Number(r.rate)),
  deliveryPointId: r.delivery_point_id,
  status: r.status as OrderStatus,
  createdAt: r.created_at,
});

export const mapCoupon = (r: CouponRow): DeliveryRecord => ({
  couponNo: r.coupon_no,
  orderNo: r.order_no,
  recipientName: r.recipient_name,
  contact: r.contact,
  dateTime: r.date_time,
  location: r.location,
  floor: r.floor,
  quantity: r.quantity,
  receiverName: r.receiver_name,
  remarks: r.remarks,
});

export const mapCollection = (r: CollectionRow): CollectionRecord => ({
  orderNo: r.order_no,
  amountDue: Number(r.amount_due),
  amountCollected: Number(r.amount_collected),
  method: r.method as CollectionRecord["method"],
  reference: r.reference,
  status: r.status as CollectionRecord["status"],
  collectorName: r.collector_name,
  date: r.date ?? r.updated_at,
});

export const mapAudit = (r: AuditRow): AuditLog => ({
  id: r.id,
  user: r.actor_role ? `${r.actor_name} (${r.actor_role})` : r.actor_name,
  action: r.action,
  record: r.record,
  oldValue: r.old_value,
  newValue: r.new_value,
  timestamp: r.timestamp,
});

export const mapNotification = (
  r: NotificationRow & { notification_reads?: Array<{ user_id: string }> },
): AppNotification => ({
  id: r.id,
  kind: r.kind as AppNotification["kind"],
  audience: r.audience as Role | "All",
  title: r.title,
  body: r.body,
  timestamp: r.timestamp,
  read: (r.notification_reads?.length ?? 0) > 0,
});

export const mapSettings = (r: SettingsRow): AppSettings => ({
  defaultRate: Number(r.default_rate),
  defaultCutoff: r.default_cutoff.slice(0, 5),
  defaultEmployeeCap: r.default_employee_cap,
  defaultMinOrder: r.default_min_order,
  defaultMaxOrder: r.default_max_order,
  defaultDeliveryWindow: r.default_delivery_window,
  emailOnPublish: r.email_on_publish,
  smsBeforeCutoff: r.sms_before_cutoff,
  autoCloseAtCutoff: r.auto_close_at_cutoff,
  terms: r.terms,
});

export interface Snapshot {
  employees: Employee[];
  batches: DailyMilkBatch[];
  deliveryPoints: DeliveryPoint[];
  orders: Order[];
  deliveryRecords: DeliveryRecord[];
  collections: CollectionRecord[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  settings: AppSettings | null;
  batchStats: BatchStats[];
}

/** One round-trip for everything the signed-in user is allowed to see. */
export async function fetchSnapshot(): Promise<Snapshot> {
  const [
    employees,
    batches,
    points,
    orders,
    coupons,
    collections,
    audits,
    notifications,
    settings,
    stats,
  ] = await Promise.all([
    supabase.from("employees").select("*").order("id"),
    supabase.from("batches").select("*").order("production_date", { ascending: false }),
    supabase.from("delivery_points").select("*").order("name"),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("delivery_records").select("*").order("date_time", { ascending: false }),
    supabase.from("collections").select("*").order("updated_at", { ascending: false }),
    supabase.from("audit_log").select("*").order("timestamp", { ascending: false }).limit(300),
    supabase
      .from("notifications")
      .select("*, notification_reads(user_id)")
      .order("timestamp", { ascending: false })
      .limit(100),
    supabase.from("app_settings").select("*").maybeSingle(),
    supabase.from("batch_stats").select("*").order("production_date", { ascending: false }),
  ]);

  for (const res of [employees, batches, points, orders, coupons, collections, notifications, stats]) {
    fail(res.error);
  }

  return {
    employees: (employees.data ?? []).map(mapEmployee),
    batches: (batches.data ?? []).map(mapBatch),
    deliveryPoints: (points.data ?? []).map(mapPoint),
    orders: (orders.data ?? []).map(mapOrder),
    deliveryRecords: (coupons.data ?? []).map(mapCoupon),
    collections: (collections.data ?? []).map(mapCollection),
    auditLogs: (audits.data ?? []).map(mapAudit),
    notifications: (notifications.data ?? []).map(mapNotification),
    settings: settings.data ? mapSettings(settings.data) : null,
    batchStats: stats.data ?? [],
  };
}

export async function fetchMyContext(): Promise<{ employee: Employee | null; roles: Role[] }> {
  const [roles, employee] = await Promise.all([
    supabase.rpc("my_roles"),
    supabase.rpc("my_employee_id"),
  ]);
  fail(roles.error);
  let emp: Employee | null = null;
  if (employee.data) {
    const { data } = await supabase.from("employees").select("*").eq("id", employee.data).maybeSingle();
    emp = data ? mapEmployee(data) : null;
  }
  const list = (roles.data ?? []) as Role[];
  return { employee: emp, roles: list.length > 0 ? list : ["Employee"] };
}

// ---------- mutations ----------

export async function confirmOrder(input: {
  batchNo: string;
  litres: number;
  deliveryPointId: string;
}): Promise<Order> {
  const { data, error } = await supabase.rpc("confirm_order", {
    p_batch_no: input.batchNo,
    p_litres: input.litres,
    p_delivery_point_id: input.deliveryPointId,
  });
  fail(error);
  return mapOrder((Array.isArray(data) ? data[0] : data) as OrderRow);
}

export async function cancelOrder(orderNo: string, reason: string) {
  const { error } = await supabase.rpc("cancel_order", { p_order_no: orderNo, p_reason: reason });
  fail(error);
}

export async function adjustOrder(orderNo: string, litres: number, reason: string) {
  const { error } = await supabase.rpc("adjust_order", {
    p_order_no: orderNo,
    p_litres: litres,
    p_reason: reason,
  });
  fail(error);
}

export async function setOrderStatus(
  orderNo: string,
  status: OrderStatus,
  receiverName?: string,
  remarks?: string,
) {
  const { error } = await supabase.rpc("set_order_status", {
    p_order_no: orderNo,
    p_status: status,
    p_receiver_name: receiverName ?? undefined,
    p_remarks: remarks ?? undefined,
  });
  fail(error);
}

export async function recordCollection(input: {
  orderNo: string;
  amountCollected: number;
  method: NonNullable<CollectionRecord["method"]>;
  reference: string;
}) {
  const { error } = await supabase.rpc("record_collection", {
    p_order_no: input.orderNo,
    p_amount_collected: input.amountCollected,
    p_method: input.method,
    p_reference: input.reference,
  });
  fail(error);
}

export interface NewBatchInput {
  produced: number;
  saleable: number;
  rate: number;
  minOrder: number;
  maxOrder: number;
  employeeCap: number;
  productionDate: string;
  bookingCutoff: string;
  deliveryDate: string;
  deliveryWindow: string;
  deliveryPoints: string[];
  note: string;
}

export async function createBatch(input: NewBatchInput): Promise<DailyMilkBatch> {
  const { data, error } = await supabase.rpc("create_batch", {
    p_produced: input.produced,
    p_saleable: input.saleable,
    p_rate: input.rate,
    p_min_order: input.minOrder,
    p_max_order: input.maxOrder,
    p_employee_cap: input.employeeCap,
    p_production_date: input.productionDate,
    p_booking_cutoff: input.bookingCutoff,
    p_delivery_date: input.deliveryDate,
    p_delivery_window: input.deliveryWindow,
    p_delivery_points: input.deliveryPoints,
    p_note: input.note,
  });
  fail(error);
  return mapBatch((Array.isArray(data) ? data[0] : data) as BatchRow);
}

export async function setBatchStatus(batchNo: string, status: BatchStatus) {
  const { error } = await supabase.rpc("set_batch_status", {
    p_batch_no: batchNo,
    p_status: status,
  });
  fail(error);
}

export async function upsertEmployee(input: Employee): Promise<Employee> {
  const { data, error } = await supabase.rpc("upsert_employee", {
    p_id: input.id,
    p_name: input.name,
    p_email: input.companyEmail,
    p_phone: input.phone,
    p_department: input.department,
    p_site: input.site,
    p_active: input.active,
  });
  fail(error);
  return mapEmployee((Array.isArray(data) ? data[0] : data) as EmployeeRow);
}

export async function setEmployeeActive(id: string, active: boolean) {
  const { error } = await supabase.rpc("set_employee_active", { p_id: id, p_active: active });
  fail(error);
}

export async function upsertDeliveryPoint(input: DeliveryPoint) {
  const { error } = await supabase.rpc("upsert_delivery_point", {
    p_id: input.id,
    p_name: input.name,
    p_address: input.address,
    p_coordinator_name: input.coordinatorName,
    p_active: input.active,
  });
  fail(error);
}

export async function saveSettings(input: AppSettings) {
  const { error } = await supabase.rpc("save_settings", {
    p_default_rate: input.defaultRate,
    p_default_cutoff: `${input.defaultCutoff}:00`,
    p_default_employee_cap: input.defaultEmployeeCap,
    p_default_min_order: input.defaultMinOrder,
    p_default_max_order: input.defaultMaxOrder,
    p_default_delivery_window: input.defaultDeliveryWindow,
    p_email_on_publish: input.emailOnPublish,
    p_sms_before_cutoff: input.smsBeforeCutoff,
    p_auto_close_at_cutoff: input.autoCloseAtCutoff,
    p_terms: input.terms,
  });
  fail(error);
}

export async function markNotificationsRead() {
  const { error } = await supabase.rpc("mark_notifications_read");
  fail(error);
}
