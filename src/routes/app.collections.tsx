import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useAppData } from "@/context/app-data";
import { dateShort, taka } from "@/lib/format";
import type { CollectionRecord, Order } from "@/lib/types";

export const Route = createFileRoute("/app/collections")({
  head: () => ({
    meta: [
      { title: "Collections — Anwar Fresh" },
      { name: "description", content: "Track amount due, collected and outstanding for each order." },
      { property: "og:title", content: "Collections — Anwar Fresh" },
      { property: "og:description", content: "Record cash, bKash and payroll settlements against delivered milk orders." },
    ],
  }),
  component: CollectionsPage,
});

type Method = CollectionRecord["method"];
const methods: Method[] = ["Cash", "bKash", "Payroll deduction"];

function CollectionsPage() {
  const { orders, employees, collections, upsertCollection, addAudit, role } = useAppData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState<Order | null>(null);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<Method>("Cash");
  const [reference, setReference] = useState("");

  const payable = useMemo(
    () => orders.filter((o) => o.status === "Delivered" || o.status === "NotCollected"),
    [orders],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payable
      .map((o) => ({ order: o, record: collections.find((c) => c.orderNo === o.orderNo) }))
      .filter(({ record }) => {
        if (filter === "all") return true;
        const status = record?.status ?? "Unpaid";
        return status === filter;
      })
      .filter(({ order }) => {
        if (!q) return true;
        const emp = employees.find((e) => e.id === order.employeeId);
        return (
          order.orderNo.toLowerCase().includes(q) || (emp?.name.toLowerCase().includes(q) ?? false)
        );
      });
  }, [payable, collections, employees, filter, query]);

  const due = payable.reduce((s, o) => s + o.amount, 0);
  const collected = collections.reduce((s, c) => s + c.amountCollected, 0);
  const outstanding = Math.max(0, due - collected);

  function openRecord(order: Order) {
    const existing = collections.find((c) => c.orderNo === order.orderNo);
    setActive(order);
    setAmount(existing?.amountCollected ?? order.amount);
    setMethod(existing?.method ?? "Cash");
    setReference(existing?.reference ?? "");
  }

  function save() {
    if (!active) return;
    if (amount < 0 || amount > active.amount) {
      toast.error(`Amount must be between ৳0 and ${taka(active.amount)}.`);
      return;
    }
    const status: CollectionRecord["status"] =
      amount === 0 ? "Unpaid" : amount >= active.amount ? "Paid" : "Partial";
    upsertCollection({
      orderNo: active.orderNo,
      amountDue: active.amount,
      amountCollected: amount,
      method,
      reference: reference.trim() || "—",
      status,
      collectorName: "Finance desk",
      date: new Date().toISOString(),
    });
    addAudit({
      user: role,
      action: `Recorded payment — ${method}`,
      record: active.orderNo,
      oldValue: taka(collections.find((c) => c.orderNo === active.orderNo)?.amountCollected ?? 0),
      newValue: taka(amount),
    });
    toast.success(`${active.orderNo} marked ${status.toLowerCase()}`);
    setActive(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Collections"
        description="Settle every delivered order — cash, bKash or payroll deduction."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Amount due" value={due} format={taka} />
        <StatCard label="Collected" value={collected} format={taka} emphasis />
        <StatCard label="Outstanding" value={outstanding} format={taka} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search order or employee"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Partial">Partial</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Nothing to collect" hint="Delivered orders will appear here." />
          </div>
        ) : (
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <Th>Order</Th>
                <Th>Employee</Th>
                <Th>Due</Th>
                <Th>Collected</Th>
                <Th>Method</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ order, record }, i) => {
                const emp = employees.find((e) => e.id === order.employeeId);
                const status = record?.status ?? "Unpaid";
                return (
                  <motion.tr
                    key={order.orderNo}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.012, 0.2) }}
                    className="border-b border-border/60 last:border-0"
                  >
                    <Td className="font-medium">{order.orderNo}</Td>
                    <Td>
                      {emp?.name ?? order.employeeId}
                      <span className="block text-xs text-muted-foreground">{emp?.department}</span>
                    </Td>
                    <Td>{taka(order.amount)}</Td>
                    <Td>{taka(record?.amountCollected ?? 0)}</Td>
                    <Td>{record?.method ?? "—"}</Td>
                    <Td className="text-muted-foreground">
                      {record ? dateShort(record.date) : "—"}
                    </Td>
                    <Td>
                      <PayBadge status={status} />
                    </Td>
                    <Td>
                      <Button variant="outline" size="sm" onClick={() => openRecord(order)}>
                        {record ? "Update" : "Record"}
                      </Button>
                    </Td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment — {active?.orderNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Amount due <span className="font-medium text-foreground">{taka(active?.amount ?? 0)}</span>
            </p>
            <div>
              <Label className="mb-2 block">Amount collected (৳)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-2 block">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Reference</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Receipt or transaction no."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save}>Save payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PayBadge({ status }: { status: CollectionRecord["status"] }) {
  const styles =
    status === "Paid"
      ? "bg-primary text-primary-foreground border-primary"
      : status === "Partial"
        ? "bg-accent/15 text-accent-foreground border-accent/40"
        : "bg-destructive/10 text-destructive border-destructive/25";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
