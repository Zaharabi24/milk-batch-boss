import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/collections")({
  head: () => ({ meta: [{ title: "Collections — Anwar Fresh" }, { name: "description", content: "Track amount due, collected and outstanding for each order." }] }),
  component: () => <PagePlaceholder title="Collections" description="Track amount due, collected and outstanding for each order." />,
});
