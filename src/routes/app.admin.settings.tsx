import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Anwar Fresh" }, { name: "description", content: "Default employee cap, quantity increment and other defaults." }] }),
  component: () => <PagePlaceholder title="Settings" description="Default employee cap, quantity increment and other defaults." />,
});
