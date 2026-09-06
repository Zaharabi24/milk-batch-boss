import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/operator/publish")({
  head: () => ({ meta: [{ title: "Review and publish — Anwar Fresh" }, { name: "description", content: "Preview the batch as employees see it, then publish it." }] }),
  component: () => <PagePlaceholder title="Review and publish" description="Preview the batch as employees see it, then publish it." />,
});
