export type Role =
  | "Employee"
  | "Factory Operator"
  | "Head Office Coordinator"
  | "Finance"
  | "System Admin";

export type Department =
  | "Production"
  | "Finance"
  | "HR"
  | "Sales"
  | "IT"
  | "Admin"
  | "Procurement";

export type Site = "Head Office – Gulshan" | "Savar Factory";

export interface Employee {
  id: string;
  name: string;
  companyEmail: string;
  phone: string;
  department: Department;
  site: Site;
  active: boolean;
}

export type BatchStatus = "Draft" | "Active" | "Paused" | "SoldOut" | "Closed";

export interface DailyMilkBatch {
  batchNo: string;
  productionDate: string;
  product: string;
  producedLitres: number;
  saleableLitres: number;
  ratePerLitre: number;
  minOrder: number;
  maxOrder: number;
  employeeCap: number;
  bookingCutoff: string;
  deliveryDate: string;
  deliveryWindow: string;
  deliveryPoints: string[];
  note: string;
  status: BatchStatus;
}

export interface DeliveryPoint {
  id: string;
  name: string;
  address: string;
  coordinatorName: string;
  active: boolean;
}

export type OrderStatus =
  | "Confirmed"
  | "Packed"
  | "OutForDelivery"
  | "Delivered"
  | "Cancelled"
  | "NotCollected";

export interface Order {
  orderNo: string;
  employeeId: string;
  batchNo: string;
  litres: number;
  rate: number;
  amount: number;
  deliveryPointId: string;
  status: OrderStatus;
  createdAt: string;
}

export interface DeliveryRecord {
  orderNo: string;
  recipientName: string;
  contact: string;
  dateTime: string;
  location: string;
  quantity: number;
  receiverName: string;
  remarks: string;
}

export interface CollectionRecord {
  orderNo: string;
  amountDue: number;
  amountCollected: number;
  method: "Cash" | "bKash" | "Payroll deduction";
  reference: string;
  status: "Paid" | "Unpaid" | "Partial";
  collectorName: string;
  date: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  record: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}
