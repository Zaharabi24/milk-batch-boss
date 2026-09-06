import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/app/admin/employees")({
  head: () => ({ meta: [{ title: "Employees — Anwar Fresh" }, { name: "description", content: "Add, edit and deactivate employees across departments and sites." }] }),
  component: () => <PagePlaceholder title="Employees" description="Add, edit and deactivate employees across departments and sites." />,
});
