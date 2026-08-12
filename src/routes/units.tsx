import { createFileRoute } from "@tanstack/react-router";
import { Ruler, RotateCcw, Check } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { applyUnitSystem, setUnit, useUnits } from "@/hooks/useUnits";
import { quantityList, type QuantityId } from "@/lib/units";
import { toast } from "sonner";

export const Route = createFileRoute("/units")({
  head: () => ({
    meta: [
      { title: "Units & Preferences — Thermaflux Engineering Studio" },
      {
        name: "description",
        content:
          "Switch every Thermaflux calculation between SI and oilfield units, or set each quantity individually — diameter in inches, flow in bbl/d, pressure in psi and more.",
      },
      { property: "og:title", content: "Units & Preferences — Thermaflux" },
      {
        property: "og:description",
        content:
          "Choose SI or oilfield field units, or mix them per quantity. Preferences apply across every calculator and export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UnitsPage,
});

/** Representative SI value per quantity so the user sees a live conversion preview. */
const SAMPLES: Record<string, number> = {
  length: 250,
  diameter: 0.1,
  roughness: 0.000045,
  flow: 0.02,
  velocity: 2.546,
  pressure: 147000,
  gradient: 588,
  head: 15,
  temperature: 90,
  power: 12000,
  heatFlux: 5250,
  density: 998.2,
  viscosity: 0.001002,
  area: 2.5,
  time: 1800,
};

function UnitsPage() {
  const u = useUnits();
  const quantities = quantityList();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Preferences"
        title="Units"
        description="Thermaflux always solves in SI internally, then presents results in whatever units you work in. Flip the whole app between SI and oilfield units, or fine-tune a single quantity — inches for bore, bbl/d for rate, psi for pressure."
      />

      <div className="panel mb-6 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Ruler className="mt-0.5 size-6 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-lg font-extrabold">Unit system</h2>
              <p className="text-sm text-muted-foreground">
                Currently:{" "}
                <span className="font-semibold text-foreground">
                  {u.system === "si"
                    ? "SI (metric)"
                    : u.system === "field"
                      ? "Oilfield (field units)"
                      : "Custom mix"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <SystemButton
              active={u.system === "si"}
              label="SI / metric"
              onClick={() => {
                applyUnitSystem("si");
                toast.success("Switched to SI units");
              }}
            />
            <SystemButton
              active={u.system === "field"}
              label="Oilfield units"
              onClick={() => {
                applyUnitSystem("field");
                toast.success("Switched to oilfield units");
              }}
            />
            <button
              type="button"
              onClick={() => {
                applyUnitSystem("si");
                toast.message("Preferences reset to SI defaults");
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="size-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[1.2fr_1fr_1fr] gap-4 border-b border-border/70 px-5 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground sm:grid">
          <span>Quantity</span>
          <span>Display unit</span>
          <span>Example</span>
        </div>
        <ul className="divide-y divide-border/60">
          {quantities.map((q) => {
            const id = q.id as QuantityId;
            const sample = SAMPLES[q.id] ?? 1;
            return (
              <li
                key={q.id}
                className="grid gap-3 px-5 py-4 sm:grid-cols-[1.2fr_1fr_1fr] sm:items-center sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold text-foreground">{q.label}</p>
                  <p className="text-xs text-muted-foreground">SI base: {q.base}</p>
                </div>
                <select
                  value={u.prefs[id]}
                  onChange={(e) => setUnit(id, e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  aria-label={`${q.label} unit`}
                >
                  {q.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
                <p className="font-mono text-sm text-muted-foreground">
                  {sample} {q.base} ={" "}
                  <span className="font-semibold text-foreground">
                    {u.fmt(id, sample, 4)} {u.label(id)}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Preferences are stored on this device only and take effect immediately on every calculator,
        chart axis and CSV export.
      </p>
    </AppShell>
  );
}

function SystemButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-lg"
          : "border border-border text-foreground hover:bg-secondary"
      }`}
    >
      {active ? <Check className="size-4" /> : null}
      {label}
    </button>
  );
}
