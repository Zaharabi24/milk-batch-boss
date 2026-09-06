import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/admin/delivery-points")({
  head: () => ({ meta: [{ title: "Delivery points — Anwar Fresh" }, { name: "description", content: "Manage the fixed collection points." }] }),
  component: () => <PagePlaceholder title="Delivery points" description="Manage the fixed collection points." />,
});
