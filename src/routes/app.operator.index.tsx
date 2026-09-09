import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { BatchStatusBadge } from "@/components/status-badge";
import { useAppData } from "@/context/app-data";
import { dateShort, litres, taka } from "@/lib/format";

export const Route = createFileRoute("/app/operator/")({
  head: () => ({
    meta: [
      { title: "Operator dashboard — Anwar Fresh" },
      { name: "description", content: "Today's litres available, booked, delivered and unsold." },
      { property: "og:title", content: "Operator dashboard — Anwar Fresh" },
      { property: "og:description", content: "Today's litres available, booked, delivered and unsold." },
    ],
  }),
  component: OperatorDashboard,
});

function OperatorDashboard() {
  const { batches, activeBatch, orders, remainingLitres, setBatchStatus, batchStats } = useAppData();

  if (!activeBatch) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader title="Operator dashboard" description="No batch is open today." />
        <EmptyState title="No active batch" hint="Create today's batch to start taking bookings." />
        <Button asChild className="mt-4">
          <Link to="/app/operator/new-batch">Create batch</Link>
        </Button>
      </div>
    );
  }

  const todayOrders = orders.filter(
    (o) => o.batchNo === activeBatch.batchNo && o.status !== "Cancelled",
  );
  const booked = todayOrders.reduce((s, o) => s + o.litres, 0);
  const delivered = todayOrders
    .filter((o) => o.status === "Delivered")
    .reduce((s, o) => s + o.litres, 0);
  const unsold = remainingLitres(activeBatch.batchNo);
  const revenue = todayOrders.reduce((s, o) => s + o.amount, 0);

  const trend = batches
    .slice(0, 7)
    .reverse()
    .map((b) => {
      const stats = batchStats.find((s) => s.batch_no === b.batchNo);
      const live = orders.filter((o) => o.batchNo === b.batchNo && o.status !== "Cancelled");
      return {
        name: dateShort(b.productionDate).slice(0, 6),
        Produced: b.producedLitres,
        Booked: stats?.booked_litres ?? live.reduce((s, o) => s + o.litres, 0),
        Delivered:
          stats?.delivered_litres ??
          live.filter((o) => o.status === "Delivered").reduce((s, o) => s + o.litres, 0),
      };
    });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Operator dashboard"
        description={`${activeBatch.batchNo} · ${activeBatch.product} · ${taka(activeBatch.ratePerLitre)}/L`}
        action={
          <div className="flex items-center gap-2">
            <BatchStatusBadge status={activeBatch.status} />
            {activeBatch.status === "Active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void setBatchStatus(activeBatch.batchNo, "Paused").catch((e) => toast.error(e instanceof Error ? e.message : "Could not update the batch"))}
              >
                Pause bookings
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => void setBatchStatus(activeBatch.batchNo, "Active").catch((e) => toast.error(e instanceof Error ? e.message : "Could not update the batch"))}
              >
                Resume bookings
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void setBatchStatus(activeBatch.batchNo, "Closed").catch((e) => toast.error(e instanceof Error ? e.message : "Could not update the batch"))}
            >
              Close batch
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saleable" value={activeBatch.saleableLitres} format={litres} hint={`Produced ${activeBatch.producedLitres} L`} />
        <StatCard label="Booked" value={booked} format={litres} emphasis hint={`${todayOrders.length} orders`} />
        <StatCard label="Delivered" value={delivered} format={litres} />
        <StatCard label="Unsold" value={unsold} format={litres} hint={`Value ${taka(revenue)} booked`} />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold">Last 7 batches</h2>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: "var(--secondary)" }} />
              <Bar dataKey="Produced" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Booked" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Delivered" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
