import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/page-header";
import { useAppData } from "@/context/app-data";
import { taka } from "@/lib/format";

export const Route = createFileRoute("/app/operator/new-batch")({
  head: () => ({
    meta: [
      { title: "New batch — Anwar Fresh" },
      { name: "description", content: "Create today's milk batch with rate, limits and delivery details." },
      { property: "og:title", content: "New batch — Anwar Fresh" },
      { property: "og:description", content: "Create today's milk batch with rate, limits and delivery details." },
    ],
  }),
  component: NewBatch,
});

function todayAt(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function NewBatch() {
  const { deliveryPoints, addBatch, settings } = useAppData();
  const navigate = useNavigate();

  const [produced, setProduced] = useState(640);
  const [saleable, setSaleable] = useState(600);
  const [rate, setRate] = useState(settings?.defaultRate ?? 92);
  const [minOrder, setMin] = useState(settings?.defaultMinOrder ?? 1);
  const [maxOrder, setMax] = useState(settings?.defaultMaxOrder ?? 10);
  const [cap, setCap] = useState(settings?.defaultEmployeeCap ?? 10);
  const [window, setWindow] = useState(settings?.defaultDeliveryWindow ?? "4:00 PM – 6:30 PM");
  const [note, setNote] = useState("Chilled at 4°C. Please bring your own carry bag.");
  const [points, setPoints] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const invalid = saleable > produced || minOrder > maxOrder || points.length === 0;

  async function submit() {
    if (invalid) {
      toast.error("Please fix the highlighted values first.");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const batch = await addBatch({
        productionDate: todayAt(6),
        produced,
        saleable,
        rate,
        minOrder,
        maxOrder,
        employeeCap: cap,
        bookingCutoff: todayAt(13),
        deliveryDate: todayAt(16),
        deliveryWindow: window,
        deliveryPoints: points,
        note,
      });
      toast.success(`${batch.batchNo} saved as draft`);
      void navigate({ to: "/app/operator/publish" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the batch");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="New batch" description="Saved as a draft — employees see it only after you publish." />

      <div className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Produced litres">
            <Input type="number" value={produced} onChange={(e) => setProduced(Number(e.target.value))} />
          </Field>
          <Field label="Saleable litres" error={saleable > produced ? "Cannot exceed produced" : undefined}>
            <Input type="number" value={saleable} onChange={(e) => setSaleable(Number(e.target.value))} />
          </Field>
          <Field label="Rate per litre (৳)">
            <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Minimum order (L)" error={minOrder > maxOrder ? "Above maximum" : undefined}>
            <Input type="number" value={minOrder} onChange={(e) => setMin(Number(e.target.value))} />
          </Field>
          <Field label="Maximum order (L)">
            <Input type="number" value={maxOrder} onChange={(e) => setMax(Number(e.target.value))} />
          </Field>
          <Field label="Per-employee cap (L)">
            <Input type="number" value={cap} onChange={(e) => setCap(Number(e.target.value))} />
          </Field>
        </div>

        <Field label="Delivery window">
          <Input value={window} onChange={(e) => setWindow(e.target.value)} />
        </Field>

        <div>
          <Label className="mb-2 block">Delivery points</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {deliveryPoints.filter((p) => p.active).map((p) => (
              <label key={p.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                <Checkbox
                  checked={points.includes(p.id)}
                  onCheckedChange={(v) =>
                    setPoints((prev) => (v ? [...prev, p.id] : prev.filter((x) => x !== p.id)))
                  }
                />
                <span>
                  <span className="font-medium">{p.name}</span>
                  <span className="block text-muted-foreground">{p.address}</span>
                </span>
              </label>
            ))}
          </div>
          {points.length === 0 ? (
            <p className="mt-1 text-sm text-destructive">Pick at least one point.</p>
          ) : null}
        </div>

        <Field label="Note for employees">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Potential value: <span className="font-medium text-foreground">{taka(saleable * rate)}</span>
          </p>
          <Button onClick={() => void submit()} disabled={invalid || busy}>
            {busy ? "Saving…" : "Save draft & review"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
