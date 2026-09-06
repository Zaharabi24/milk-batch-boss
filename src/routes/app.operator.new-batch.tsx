import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/operator/new-batch")({
  head: () => ({ meta: [{ title: "New batch — Anwar Fresh" }, { name: "description", content: "Create today's milk batch with rate, limits and delivery details." }] }),
  component: () => <PagePlaceholder title="New batch" description="Create today's milk batch with rate, limits and delivery details." />,
});
