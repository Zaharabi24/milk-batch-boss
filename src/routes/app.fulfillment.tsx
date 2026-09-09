import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader, EmptyState } from "@/components/page-header";
import { OrderStatusBadge } from "@/components/status-badge";
import { useAppData } from "@/context/app-data";
import { litres } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  Confirmed: "Packed",
  Packed: "OutForDelivery",
  OutForDelivery: "Delivered",
};

const nextLabel: Partial<Record<OrderStatus, string>> = {
  Confirmed: "Mark packed",
  Packed: "Mark out for delivery",
  OutForDelivery: "Mark delivered",
};

export const Route = createFileRoute("/app/fulfillment")({
  head: () => ({
    meta: [
      { title: "Fulfillment — Anwar Fresh" },
      { name: "description", content: "Orders grouped by delivery point with one-tap status updates." },
      { property: "og:title", content: "Fulfillment — Anwar Fresh" },
      { property: "og:description", content: "Orders grouped by delivery point with one-tap status updates." },
    ],
  }),
  component: Fulfillment,
});

function Fulfillment() {
  const { orders, employees, deliveryPoints, activeBatch, setOrderStatus } = useAppData();
  const [handover, setHandover] = useState<Order | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  const todays = orders.filter(
    (o) => (!activeBatch || o.batchNo === activeBatch.batchNo) && o.status !== "Cancelled",
  );

  async function move(order: Order, status: OrderStatus, receiver?: string, note?: string) {
    if (busy) return;
    setBusy(true);
    try {
      await setOrderStatus(order.orderNo, status, receiver, note);
      toast.success(
        `${order.orderNo} → ${status === "OutForDelivery" ? "out for delivery" : status === "NotCollected" ? "not collected" : status.toLowerCase()}`,
      );
      setHandover(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the order");
    } finally {
      setBusy(false);
    }
  }

  function advance(order: Order) {
    const next = nextStatus[order.status];
    if (!next) return;
    if (next === "Delivered") {
      const emp = employees.find((e) => e.id === order.employeeId);
      setReceiverName(emp?.name ?? "");
      setRemarks("");
      setHandover(order);
      return;
    }
    void move(order, next);
  }

  const groups = deliveryPoints
    .map((p) => ({ point: p, list: todays.filter((o) => o.deliveryPointId === p.id) }))
    .filter((g) => g.list.length > 0);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Fulfillment"
        description="Pack, dispatch and hand over — grouped by collection point."
      />

      {groups.length === 0 ? (
        <EmptyState title="Nothing to fulfil" hint="Orders appear here once employees book." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {groups.map(({ point, list }) => {
            const pending = list.filter((o) => o.status !== "Delivered" && o.status !== "NotCollected");
            return (
              <section key={point.id} className="rounded-xl border border-border bg-card">
                <header className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div>
                    <h2 className="font-display text-lg font-bold">{point.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {list.length} orders · {litres(list.reduce((s, o) => s + o.litres, 0))}
                    </p>
                  </div>
                  <span className="rounded-md bg-secondary px-3 py-1 text-sm text-primary-deep">
                    {pending.length} pending
                  </span>
                </header>
                <ul className="divide-y divide-border/60">
                  {list.map((o) => {
                    const emp = employees.find((e) => e.id === o.employeeId);
                    return (
                      <motion.li
                        key={o.orderNo}
                        layout
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{emp?.name ?? o.employeeId}</p>
                          <p className="text-xs text-muted-foreground">
                            {o.orderNo} · {litres(o.litres)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={o.status} />
                          {nextStatus[o.status] ? (
                            <Button size="sm" disabled={busy} onClick={() => advance(o)}>
                              {nextLabel[o.status]}
                            </Button>
                          ) : null}
                          {o.status === "OutForDelivery" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => void move(o, "NotCollected")}
                            >
                              Not collected
                            </Button>
                          ) : null}
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={!!handover} onOpenChange={(open) => !open && setHandover(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm handover</DialogTitle>
            <DialogDescription>
              A delivery coupon is issued for {handover?.orderNo} once you confirm who received the
              milk.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block" htmlFor="receiver">
                Received by
              </Label>
              <Input
                id="receiver"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Full name of the person collecting"
              />
            </div>
            <div>
              <Label className="mb-2 block" htmlFor="remarks">
                Remarks
              </Label>
              <Input
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHandover(null)}>
              Cancel
            </Button>
            <Button
              disabled={busy || receiverName.trim().length < 2}
              onClick={() => {
                if (!handover) return;
                void move(handover, "Delivered", receiverName.trim(), remarks.trim() || "—");
              }}
            >
              {busy ? "Saving…" : "Confirm delivered"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
