import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/order/confirmation/$orderId")({
  head: () => ({ meta: [{ title: "Order confirmed — Anwar Fresh" }, { name: "description", content: "Your order code, summary and collection instructions." }] }),
  component: () => <PagePlaceholder title="Order confirmed" description="Your order code, summary and collection instructions." />,
});
