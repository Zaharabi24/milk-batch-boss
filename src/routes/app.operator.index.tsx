import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/operator/")({
  head: () => ({ meta: [{ title: "Operator dashboard — Anwar Fresh" }, { name: "description", content: "Today's litres available, booked, delivered and unsold." }] }),
  component: () => <PagePlaceholder title="Operator dashboard" description="Today's litres available, booked, delivered and unsold." />,
});
