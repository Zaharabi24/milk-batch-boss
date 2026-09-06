import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/orders")({
  head: () => ({ meta: [{ title: "Orders — Anwar Fresh" }, { name: "description", content: "Search, filter and adjust incoming employee orders." }] }),
  component: () => <PagePlaceholder title="Orders" description="Search, filter and adjust incoming employee orders." />,
});
