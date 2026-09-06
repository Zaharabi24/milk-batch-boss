import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Anwar Fresh — Anwar Fresh" }, { name: "description", content: "Pick a section from the sidebar to get started." }] }),
  component: () => <PagePlaceholder title="Anwar Fresh" description="Pick a section from the sidebar to get started." />,
});
