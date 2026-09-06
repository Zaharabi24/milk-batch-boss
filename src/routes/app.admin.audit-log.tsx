import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/admin/audit-log")({
  head: () => ({ meta: [{ title: "Audit log — Anwar Fresh" }, { name: "description", content: "Every change made in the app, with old and new values." }] }),
  component: () => <PagePlaceholder title="Audit log" description="Every change made in the app, with old and new values." />,
});
