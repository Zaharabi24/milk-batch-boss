import type {
  AuditLog,
  CollectionRecord,
  DailyMilkBatch,
  DeliveryPoint,
  DeliveryRecord,
  Employee,
  Order,
} from "./types";

export const deliveryPoints: DeliveryPoint[] = [
  {
    id: "dp-gulshan",
    name: "Head Office – Gulshan",
    address: "Ground floor lobby, Anwar Tower, Gulshan Avenue",
    coordinatorName: "Nusrat Jahan",
    active: true,
  },
  {
    id: "dp-savar",
    name: "Factory Gate – Savar",
    address: "Gate 2 security desk, Savar dairy unit",
    coordinatorName: "Kamal Hossain",
    active: true,
  },
  {
    id: "dp-ctg",
    name: "Regional Office – Chattogram",
    address: "Reception, Agrabad C/A",
    coordinatorName: "Imran Kabir",
    active: true,
  },
  {
    id: "dp-ashulia",
    name: "Depot – Ashulia",
    address: "Cold store counter, Ashulia depot",
    coordinatorName: "Sultana Razia",
    active: true,
  },
];

const seedNames: Array<[string, Employee["department"], Employee["site"]]> = [
  ["Rahim Uddin", "Production", "Savar Factory"],
  ["Nusrat Jahan", "Admin", "Head Office – Gulshan"],
  ["Kamal Hossain", "Production", "Savar Factory"],
  ["Fatima Akter", "Finance", "Head Office – Gulshan"],
  ["Shakil Ahmed", "IT", "Head Office – Gulshan"],
  ["Ayesha Siddika", "HR", "Head Office – Gulshan"],
  ["Tanvir Rahman", "Sales", "Head Office – Gulshan"],
  ["Sultana Razia", "Procurement", "Savar Factory"],
  ["Imran Kabir", "Sales", "Head Office – Gulshan"],
  ["Mahmuda Khatun", "Finance", "Head Office – Gulshan"],
  ["Arif Chowdhury", "Production", "Savar Factory"],
  ["Sharmin Sultana", "HR", "Savar Factory"],
];

export const employees: Employee[] = seedNames.map(([name, department, site], i) => ({
  id: `EMP-${(1001 + i).toString()}`,
  name,
  companyEmail: `${name.toLowerCase().replace(/\s+/g, ".")}@anwaragro.com`,
  phone: `+8801${(700000000 + i * 1234567).toString().slice(0, 9)}`,
  department,
  site,
  active: true,
}));

function todayAt(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const activeBatch: DailyMilkBatch = {
  batchNo: "BATCH-2409",
  productionDate: new Date().toISOString(),
  product: "Fresh Whole Milk",
  producedLitres: 640,
  saleableLitres: 600,
  ratePerLitre: 92,
  minOrder: 1,
  maxOrder: 10,
  employeeCap: 10,
  bookingCutoff: todayAt(23, 30),
  deliveryDate: new Date(Date.now() + 86400000).toISOString(),
  deliveryWindow: "4:00 PM – 6:30 PM",
  deliveryPoints: ["dp-gulshan", "dp-savar"],
  note: "Chilled at 4°C. Please bring your own carry bag.",
  status: "Active",
};

export const batches: DailyMilkBatch[] = [activeBatch];

export const orders: Order[] = [
  {
    orderNo: "ORD-8801",
    employeeId: "EMP-1001",
    batchNo: "BATCH-2409",
    litres: 4,
    rate: 92,
    amount: 368,
    deliveryPointId: "dp-savar",
    status: "Confirmed",
    createdAt: todayAt(9, 12),
  },
  {
    orderNo: "ORD-8802",
    employeeId: "EMP-1004",
    batchNo: "BATCH-2409",
    litres: 2,
    rate: 92,
    amount: 184,
    deliveryPointId: "dp-gulshan",
    status: "Confirmed",
    createdAt: todayAt(9, 41),
  },
  {
    orderNo: "ORD-8803",
    employeeId: "EMP-1007",
    batchNo: "BATCH-2409",
    litres: 6,
    rate: 92,
    amount: 552,
    deliveryPointId: "dp-gulshan",
    status: "Packed",
    createdAt: todayAt(10, 5),
  },
];

export const deliveryRecords: DeliveryRecord[] = [];

export const collections: CollectionRecord[] = [];

export const auditLogs: AuditLog[] = [
  {
    id: "AL-001",
    user: "Kamal Hossain",
    action: "Published batch",
    record: "BATCH-2409",
    oldValue: "Draft",
    newValue: "Active",
    timestamp: todayAt(8, 30),
  },
];
