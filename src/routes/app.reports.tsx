import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports — Anwar Fresh" }, { name: "description", content: "Daily reconciliation: produced, booked, delivered, collected and sell-through." }] }),
  component: () => <PagePlaceholder title="Reports" description="Daily reconciliation: produced, booked, delivered, collected and sell-through." />,
});
