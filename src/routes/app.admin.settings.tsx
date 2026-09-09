import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { useAppData } from "@/context/app-data";

export const Route = createFileRoute("/app/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Anwar Fresh" },
      { name: "description", content: "Default rate, booking cutoff, caps and notification rules." },
      { property: "og:title", content: "Settings — Anwar Fresh" },
      { property: "og:description", content: "Default rate, booking cutoff, caps and notification rules." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { addAudit, role } = useAppData();
  const [rate, setRate] = useState(92);
  const [cutoff, setCutoff] = useState("13:00");
  const [cap, setCap] = useState(10);
  const [minOrder, setMinOrder] = useState(1);
  const [window, setWindow] = useState("4:00 PM – 6:30 PM");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [autoClose, setAutoClose] = useState(true);
  const [terms, setTerms] = useState(
    "Milk is sold to employees at cost. Orders are binding after the daily cutoff and settled through payroll unless paid at collection.",
  );

  function save() {
    addAudit({
      user: role,
      action: "Updated system settings",
      record: "SETTINGS",
      oldValue: "Previous defaults",
      newValue: `৳${rate}/L, cutoff ${cutoff}, cap ${cap} L`,
    });
    toast.success("Settings saved");
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Settings" description="Defaults applied to every new batch." />

      <div className="space-y-6">
        <Section title="Batch defaults" hint="Operators can override these per batch.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Rate per litre (৳)">
              <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </Field>
            <Field label="Booking cutoff">
              <Input type="time" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
            </Field>
            <Field label="Per-employee cap (L)">
              <Input type="number" value={cap} onChange={(e) => setCap(Number(e.target.value))} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum order (L)">
              <Input type="number" value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} />
            </Field>
            <Field label="Default delivery window">
              <Input value={window} onChange={(e) => setWindow(e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Notifications" hint="How employees hear about the daily batch.">
          <Toggle
            label="Email employees when a batch is published"
            checked={emailAlerts}
            onChange={setEmailAlerts}
          />
          <Toggle label="Send SMS reminders before cutoff" checked={smsAlerts} onChange={setSmsAlerts} />
          <Toggle
            label="Close bookings automatically at cutoff"
            checked={autoClose}
            onChange={setAutoClose}
          />
        </Section>

        <Section title="Terms shown at checkout">
          <Textarea rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} />
        </Section>

        <div className="flex justify-end">
          <Button onClick={save}>Save settings</Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
