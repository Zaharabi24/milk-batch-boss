import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useAppData } from "@/context/app-data";
import type { Department, Employee, Site } from "@/lib/types";

export const Route = createFileRoute("/app/admin/employees")({
  head: () => ({
    meta: [
      { title: "Employees — Anwar Fresh" },
      { name: "description", content: "Add, edit and deactivate employees across departments and sites." },
      { property: "og:title", content: "Employees — Anwar Fresh" },
      { property: "og:description", content: "Manage who can book milk from the daily batch." },
    ],
  }),
  component: EmployeesPage,
});

const departments: Department[] = [
  "Production",
  "Finance",
  "HR",
  "Sales",
  "IT",
  "Admin",
  "Procurement",
];
const sites: Site[] = ["Head Office – Gulshan", "Savar Factory"];

const blank: Employee = {
  id: "",
  name: "",
  companyEmail: "",
  phone: "",
  department: "Production",
  site: "Savar Factory",
  active: true,
};

function EmployeesPage() {
  const { employees, upsertEmployee, setEmployeeActive } = useAppData();
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [site, setSite] = useState("all");
  const [draft, setDraft] = useState<Employee | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) => (dept === "all" ? true : e.department === dept))
      .filter((e) => (site === "all" ? true : e.site === site))
      .filter(
        (e) =>
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.companyEmail.toLowerCase().includes(q),
      );
  }, [employees, query, dept, site]);

  async function toggleActive(emp: Employee) {
    try {
      await setEmployeeActive(emp.id, !emp.active);
      toast.success(`${emp.name} ${emp.active ? "deactivated" : "activated"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the employee");
    }
  }

  async function save() {
    if (!draft || busy) return;
    if (!draft.name.trim() || !draft.companyEmail.trim()) {
      toast.error("Name and company email are required.");
      return;
    }
    setBusy(true);
    try {
      const id = isNew ? `EMP-${1000 + employees.length + 1}` : draft.id;
      await upsertEmployee({ ...draft, id });
      toast.success(`${draft.name} ${isNew ? "added" : "updated"}`);
      setDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the employee");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Employees"
        description="Everyone eligible to book from the daily batch."
        action={
          <Button
            onClick={() => {
              setDraft(blank);
              setIsNew(true);
            }}
          >
            Add employee
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total employees" value={employees.length} />
        <StatCard label="Active" value={employees.filter((e) => e.active).length} emphasis />
        <StatCard label="Inactive" value={employees.filter((e) => !e.active).length} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search name, ID or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={site} onValueChange={setSite}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sites</SelectItem>
            {sites.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No employees match" hint="Try clearing the filters." />
          </div>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Department</Th>
                <Th>Site</Th>
                <Th>Contact</Th>
                <Th>Active</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.01, 0.2) }}
                  className="border-b border-border/60 last:border-0"
                >
                  <Td className="font-medium">{e.id}</Td>
                  <Td>{e.name}</Td>
                  <Td>{e.department}</Td>
                  <Td>{e.site}</Td>
                  <Td>
                    {e.companyEmail}
                    <span className="block text-xs text-muted-foreground">{e.phone}</span>
                  </Td>
                  <Td>
                    <Switch checked={e.active} onCheckedChange={() => void toggleActive(e)} />
                  </Td>
                  <Td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDraft(e);
                        setIsNew(false);
                      }}
                    >
                      Edit
                    </Button>
                  </Td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!draft} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? "Add employee" : `Edit ${draft?.name}`}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Full name</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-2 block">Company email</Label>
                  <Input
                    value={draft.companyEmail}
                    onChange={(e) => setDraft({ ...draft, companyEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Phone</Label>
                  <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-2 block">Department</Label>
                  <Select
                    value={draft.department}
                    onValueChange={(v) => setDraft({ ...draft, department: v as Department })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Site</Label>
                  <Select value={draft.site} onValueChange={(v) => setDraft({ ...draft, site: v as Site })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
