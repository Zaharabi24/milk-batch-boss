import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/fulfillment")({
  head: () => ({ meta: [{ title: "Fulfillment — Anwar Fresh" }, { name: "description", content: "Orders grouped by delivery point with one-tap status updates." }] }),
  component: () => <PagePlaceholder title="Fulfillment" description="Orders grouped by delivery point with one-tap status updates." />,
});
