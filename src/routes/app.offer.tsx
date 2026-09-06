import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/offer")({
  head: () => ({ meta: [{ title: "Today's offer — Anwar Fresh" }, { name: "description", content: "See today's batch, the live litres remaining and the booking cut-off." }] }),
  component: () => <PagePlaceholder title="Today's offer" description="See today's batch, the live litres remaining and the booking cut-off." />,
});
