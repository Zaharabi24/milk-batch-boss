import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/page-header";
import { OrderStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/app-data";
import { countdown, dateTime, taka } from "@/lib/format";

export const Route = createFileRoute("/app/my-orders")({
  head: () => ({
    meta: [
      { title: "My orders — Anwar Fresh" },
      {
        name: "description",
        content: "Your booking history and the option to cancel before cut-off.",
      },
    ],
  }),
  component: MyOrdersPage,
});

function MyOrdersPage() {
  const { orders, currentEmployee, batches, deliveryPoints, cancelOrder } = useAppData();
  const mine = orders
    .filter((o) => o.employeeId === currentEmployee.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="My orders" description={`Everything you've booked, ${currentEmployee.name.split(" ")[0]}.`} />

      {mine.length === 0 ? (
        <EmptyState
          title="You haven't booked any milk yet"
          hint="Today's offer shows what's available right now."
        />
      ) : (
        <div className="space-y-3">
          {mine.map((order) => {
            const batch = batches.find((b) => b.batchNo === order.batchNo);
            const point = deliveryPoints.find((d) => d.id === order.deliveryPointId);
            const canCancel =
              order.status === "Confirmed" &&
              !!batch &&
              batch.status !== "Closed" &&
              !!countdown(batch.bookingCutoff);
            return (
              <article
                key={order.orderNo}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-bold">{order.orderNo}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.litres} L · {taka(order.amount)} · {point?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">Booked {dateTime(order.createdAt)}</p>
                </div>
                {canCancel ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      cancelOrder(order.orderNo, "Cancelled by employee before cut-off");
                      toast.success(`${order.orderNo} cancelled — litres returned to stock`);
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link to="/app/offer">See today's offer</Link>
        </Button>
      </div>
    </div>
  );
}
