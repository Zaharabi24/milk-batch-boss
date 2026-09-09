import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useAppData } from "@/context/app-data";
import { batchTotals } from "@/lib/mock-data";
import { dateShort, litres, taka } from "@/lib/format";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Anwar Fresh" },
      { name: "description", content: "Daily reconciliation: produced, booked, delivered, collected and sell-through." },
      { property: "og:title", content: "Reports — Anwar Fresh" },
      { property: "og:description", content: "Daily reconciliation: produced, booked, delivered, collected and sell-through." },
    ],
  }),
  component: ReportsPage,
});

const PALETTE = ["var(--color-primary)", "var(--color-accent)", "var(--color-info)", "var(--color-muted-foreground)"];

function ReportsPage() {
  const { batches, orders, collections, deliveryPoints } = useAppData();
  const [range, setRange] = useState("7");

  const span = Number(range);

  const series = useMemo(
    () =>
      batches
        .slice(0, span)
        .reverse()
        .map((b) => {
          const totals = batchTotals[b.batchNo];
          const live = orders.filter((o) => o.batchNo === b.batchNo && o.status !== "Cancelled");
          const booked = totals?.booked ?? live.reduce((s, o) => s + o.litres, 0);
          const delivered =
            totals?.delivered ??
            live.filter((o) => o.status === "Delivered").reduce((s, o) => s + o.litres, 0);
          return {
            name: dateShort(b.productionDate).slice(0, 6),
            produced: b.producedLitres,
            booked,
            delivered,
            unsold: Math.max(0, b.saleableLitres - booked),
            revenue: delivered * b.ratePerLitre,
            sellThrough: Math.round((booked / b.saleableLitres) * 100),
          };
        }),
    [batches, orders, span],
  );

  const produced = series.reduce((s, r) => s + r.produced, 0);
  const booked = series.reduce((s, r) => s + r.booked, 0);
  const delivered = series.reduce((s, r) => s + r.delivered, 0);
  const revenue = series.reduce((s, r) => s + r.revenue, 0);
  const collected = collections.reduce((s, c) => s + c.amountCollected, 0);
  const sellThrough = produced ? Math.round((booked / produced) * 100) : 0;

  const byPoint = useMemo(
    () =>
      deliveryPoints.map((p) => ({
        name: p.name,
        value: orders
          .filter((o) => o.deliveryPointId === p.id && o.status !== "Cancelled")
          .reduce((s, o) => s + o.litres, 0),
      })),
    [deliveryPoints, orders],
  );

  function exportCsv() {
    const header = "Date,Produced,Booked,Delivered,Unsold,Revenue\n";
    const body = series
      .map((r) => [r.name, r.produced, r.booked, r.delivered, r.unsold, r.revenue].join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anwar-fresh-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Reports"
        description="Reconcile what was produced, booked, delivered and collected."
        action={
          <div className="flex gap-3">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Last 5 batches</SelectItem>
                <SelectItem value="7">Last 7 batches</SelectItem>
                <SelectItem value="10">Last 10 batches</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv}>
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Produced" value={produced} format={litres} />
        <StatCard label="Booked" value={booked} format={litres} emphasis />
        <StatCard label="Delivered" value={delivered} format={litres} />
        <StatCard label="Sell-through" value={sellThrough} format={(v) => `${v}%`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Revenue value" value={revenue} format={taka} />
        <StatCard label="Cash collected" value={collected} format={taka} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Produced vs booked vs delivered" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Bar dataKey="produced" fill="var(--color-muted-foreground)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="booked" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delivered" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Litres by delivery point">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byPoint} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {byPoint.map((entry, i) => (
                  <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenue trend" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                formatter={(v: number) => taka(v)}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#rev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Produced</th>
              <th className="px-4 py-3 font-medium">Booked</th>
              <th className="px-4 py-3 font-medium">Delivered</th>
              <th className="px-4 py-3 font-medium">Unsold</th>
              <th className="px-4 py-3 font-medium">Sell-through</th>
              <th className="px-4 py-3 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {series.map((r) => (
              <tr key={r.name} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">{litres(r.produced)}</td>
                <td className="px-4 py-3">{litres(r.booked)}</td>
                <td className="px-4 py-3">{litres(r.delivered)}</td>
                <td className="px-4 py-3">{litres(r.unsold)}</td>
                <td className="px-4 py-3">{r.sellThrough}%</td>
                <td className="px-4 py-3">{taka(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
