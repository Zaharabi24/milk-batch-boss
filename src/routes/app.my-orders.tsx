import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/my-orders")({
  head: () => ({ meta: [{ title: "My orders — Anwar Fresh" }, { name: "description", content: "Your booking history and the option to cancel before cut-off." }] }),
  component: () => <PagePlaceholder title="My orders" description="Your booking history and the option to cancel before cut-off." />,
});
