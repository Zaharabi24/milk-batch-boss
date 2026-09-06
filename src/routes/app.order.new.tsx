import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/order/new")({
  head: () => ({ meta: [{ title: "Book milk — Anwar Fresh" }, { name: "description", content: "Choose your litres and delivery point, then confirm your order." }] }),
  component: () => <PagePlaceholder title="Book milk" description="Choose your litres and delivery point, then confirm your order." />,
});
