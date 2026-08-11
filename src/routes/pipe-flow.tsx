import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { Download, AlertTriangle } from "lucide-react";
import { AppShell, Field, Metric, PageHeader } from "@/components/AppShell";
import { Equation, FieldNote, M } from "@/components/Math";
import { AdvisorPanel } from "@/components/Advisor";
import {
  DEFAULT_ECONOMICS,
  diameterForVelocity,
  erosionalVelocity,
  flowAdvisories,
  hydraulicEconomics,
} from "@/lib/advisor";

import { FLUID_LIBRARY, Fluid, Pipe, downloadFile, fmt, toCsv } from "@/lib/engineering";
import { toast } from "sonner";

export const Route = createFileRoute("/pipe-flow")({
  head: () => ({
    meta: [
      { title: "Pipe Flow Analyser — Darcy–Weisbach Pressure Drop Calculator" },
      {
        name: "description",
        content:
          "Compute velocity, Reynolds number, Colebrook friction factor and pressure drop for water, air, crude oil or a custom fluid, with a ΔP vs flow-rate sweep and CSV export.",
      },
      { property: "og:title", content: "Pipe Flow Analyser — FlowThermal Suite" },
      {
        property: "og:description",
        content:
          "Single-phase pipe hydraulics: Reynolds number, friction factor, pressure drop, sweep plot and CSV export.",
      },
    ],
  }),
  component: PipeFlowPage,
});

const ROUGHNESS_PRESETS = [
  { label: "Drawn tubing / PVC", value: 0.0015 },
  { label: "Commercial steel", value: 0.045 },
  { label: "Galvanised iron", value: 0.15 },
  { label: "Cast iron", value: 0.26 },
  { label: "Concrete (rough)", value: 3.0 },
];

function numberOr(value: string, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function PipeFlowPage() {
  const [fluidKey, setFluidKey] = useState("water");
  const [custom, setCustom] = useState({ density: "900", viscosity: "0.005", cp: "2000", k: "0.15" });
  const [diameterMm, setDiameterMm] = useState("100");
  const [lengthM, setLengthM] = useState("250");
  const [roughnessMm, setRoughnessMm] = useState("0.045");
  const [flowLps, setFlowLps] = useState("20");

  const fluidResult = useMemo(() => {
    try {
      if (fluidKey === "custom") {
        return {
          fluid: new Fluid({
            name: "User-defined fluid",
            density: numberOr(custom.density, NaN),
            viscosity: numberOr(custom.viscosity, NaN),
            cp: numberOr(custom.cp, 0),
            k: numberOr(custom.k, 0),
          }),
          error: null as string | null,
        };
      }
      return { fluid: new Fluid(FLUID_LIBRARY[fluidKey] ?? FLUID_LIBRARY['water']!), error: null as string | null };
    } catch (e) {
      return { fluid: null, error: (e as Error).message };
    }
  }, [fluidKey, custom]);

  const analysis = useMemo(() => {
    const fluid = fluidResult.fluid;
    if (!fluid) return { error: fluidResult.error, result: null, pipe: null, q: 0, sweep: [] as { q: number; dp: number }[] };
    try {
      const pipe = new Pipe(
        numberOr(diameterMm, NaN) / 1000,
        numberOr(lengthM, NaN),
        numberOr(roughnessMm, NaN) / 1000,
      );
      const q = numberOr(flowLps, NaN) / 1000;
      if (!Number.isFinite(q) || q < 0) throw new Error("Flow rate must be zero or positive (L/s).");
      const result = pipe.analyse(fluid, q);

      const qMax = Math.max(q * 2, q + 0.001);
      const sweep = Array.from({ length: 60 }, (_, i) => {
        const qi = (qMax * (i + 1)) / 60;
        return { q: qi * 1000, dp: pipe.analyse(fluid, qi).pressureDrop / 1000 };
      });
      return { error: null as string | null, result, pipe, q, sweep };
    } catch (e) {
      return { error: (e as Error).message, result: null, pipe: null, q: 0, sweep: [] };
    }
  }, [fluidResult, diameterMm, lengthM, roughnessMm, flowLps]);

  const [energyCost, setEnergyCost] = useState("0.12");
  const [efficiency, setEfficiency] = useState("65");
  const [runHours, setRunHours] = useState("8000");

  const econ = useMemo(
    () => ({
      energyCost: numberOr(energyCost, DEFAULT_ECONOMICS.energyCost),
      efficiency: Math.min(0.98, Math.max(0.05, numberOr(efficiency, 65) / 100)),
      hoursPerYear: numberOr(runHours, DEFAULT_ECONOMICS.hoursPerYear),
    }),
    [energyCost, efficiency, runHours],
  );

  /** Economics, screening limits and advisories derived from the current duty point. */
  const decision = useMemo(() => {
    const r = analysis.result;
    const fluid = fluidResult.fluid;
    if (!r || !fluid) return null;
    const money = hydraulicEconomics(analysis.q, r.pressureDrop, econ);
    const ve = erosionalVelocity(fluid.density);
    const gradient = r.pressureDrop / Math.max(1e-9, numberOr(lengthM, 1));
    const advisories = flowAdvisories({
      velocity: r.velocity,
      reynolds: r.reynolds,
      regime: r.regime,
      pressureDrop: r.pressureDrop,
      gradient,
      density: fluid.density,
      diameter: numberOr(diameterMm, 0) / 1000,
      length: numberOr(lengthM, 0),
      flowRate: analysis.q,
      relativeRoughness: r.relativeRoughness,
      gasLike: fluid.density < 50,
    });
    return { money, ve, gradient, advisories, recommended: diameterForVelocity(analysis.q, 2) * 1000 };
  }, [analysis, fluidResult, econ, diameterMm, lengthM]);

  /** Bore-size sweep: how ΔP and velocity respond to changing the line size. */
  const sizing = useMemo(() => {
    const fluid = fluidResult.fluid;
    if (!fluid || !analysis.result || analysis.q <= 0) return [];
    const base = numberOr(diameterMm, 100);
    const out: { d: number; dp: number; v: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const d = base * (0.5 + (i * 1.5) / 39);
      try {
        const pipe = new Pipe(d / 1000, numberOr(lengthM, 1), numberOr(roughnessMm, 0.045) / 1000);
        const res = pipe.analyse(fluid, analysis.q);
        out.push({ d, dp: res.pressureDrop / 1000, v: res.velocity });
      } catch {
        /* skip invalid geometry */
      }
    }
    return out;
  }, [fluidResult, analysis, diameterMm, lengthM, roughnessMm]);


  const handleExport = () => {
    const { result, sweep } = analysis;
    const fluid = fluidResult.fluid;
    if (!result || !fluid) {
      toast.error("Fix the input errors before exporting.");
      return;
    }
    const meta = toCsv(
      ["Parameter", "Value", "Unit"],
      [
        ["Fluid", fluid.name, "-"],
        ["Density", fmt(fluid.density, 4), "kg/m3"],
        ["Dynamic viscosity", fluid.viscosity.toExponential(4), "Pa.s"],
        ["Internal diameter", diameterMm, "mm"],
        ["Pipe length", lengthM, "m"],
        ["Absolute roughness", roughnessMm, "mm"],
        ["Flow rate", flowLps, "L/s"],
        ["Velocity", fmt(result.velocity, 4), "m/s"],
        ["Reynolds number", fmt(result.reynolds, 1), "-"],
        ["Flow regime", result.regime, "-"],
        ["Friction factor (Darcy)", fmt(result.frictionFactor, 5), "-"],
        ["Pressure drop", fmt(result.pressureDrop, 2), "Pa"],
        ["Head loss", fmt(result.headLoss, 4), "m"],
      ],
    );
    const sweepCsv = toCsv(
      ["Flow rate (L/s)", "Pressure drop (kPa)"],
      sweep.map((s) => [s.q.toFixed(4), s.dp.toFixed(4)]),
    );
    downloadFile("pipe_flow_results.csv", `${meta}\n\n${sweepCsv}\n`);
    toast.success("Results exported to pipe_flow_results.csv");
  };

  const r = analysis.result;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Hydraulics"
        title="Pipe Flow Analyser"
        description="Single-phase incompressible hydraulics for a straight circular pipe. Friction is laminar below Re = 2300 and follows the Colebrook–White equation in turbulent flow; pressure drop follows Darcy–Weisbach."
      />

      <div className="panel mb-6 p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Equation tex="v=\dfrac{Q}{A}=\dfrac{4Q}{\pi D^{2}}" caption="Bulk velocity" />
          <Equation tex="Re=\dfrac{\rho v D}{\mu}" caption="Reynolds number" />
          <Equation tex="\Delta P=f\,\dfrac{L}{D}\,\dfrac{\rho v^{2}}{2}" caption="Darcy–Weisbach" />
        </div>
        <FieldNote>
          Line sizing is a money decision. A larger bore cuts <M tex="\Delta P" /> roughly as{" "}
          <M tex="D^{-5}" />, so a small diameter increase slashes pumping horsepower and fuel cost —
          but adds steel, coating and installation cost. Flowlines are usually sized to keep velocity
          in the 1–3 m/s window: fast enough to lift solids and stop wax or water dropping out, slow
          enough to avoid erosion–corrosion (the API RP 14E erosional velocity limit).
        </FieldNote>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Sidebar inputs */}
        <aside className="panel h-fit space-y-5 p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-widest text-primary">
            Inputs
          </h2>


          <Field label="Fluid" hint="Library properties are given at ~20 °C and 1 atm.">
            <select
              value={fluidKey}
              onChange={(e) => setFluidKey(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {Object.entries(FLUID_LIBRARY).map(([key, f]) => (
                <option key={key} value={key}>
                  {f.name}
                </option>
              ))}
              <option value="custom">User-defined…</option>
            </select>
          </Field>

          {fluidKey === "custom" ? (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-background/40 p-3">
              <Field label="ρ (kg/m³)">
                <input
                  type="number"
                  value={custom.density}
                  onChange={(e) => setCustom({ ...custom, density: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field label="μ (Pa·s)">
                <input
                  type="number"
                  step="any"
                  value={custom.viscosity}
                  onChange={(e) => setCustom({ ...custom, viscosity: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
              <div className="flex justify-between py-0.5">
                <span>Density ρ</span>
                <span className="font-mono text-foreground">
                  {fmt(fluidResult.fluid?.density ?? 0, 2)} kg/m³
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Viscosity μ</span>
                <span className="font-mono text-foreground">
                  {(fluidResult.fluid?.viscosity ?? 0).toExponential(3)} Pa·s
                </span>
              </div>
            </div>
          )}

          <Field label="Internal diameter, D (mm)" hint="Inside diameter of the pipe bore.">
            <input
              type="number"
              value={diameterMm}
              onChange={(e) => setDiameterMm(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <Field label="Pipe length, L (m)" hint="Straight developed length of the run.">
            <input
              type="number"
              value={lengthM}
              onChange={(e) => setLengthM(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <Field label="Absolute roughness, ε (mm)" hint="Pick a material preset or type your own.">
            <div className="space-y-2">
              <select
                value={ROUGHNESS_PRESETS.some((p) => String(p.value) === roughnessMm) ? roughnessMm : ""}
                onChange={(e) => e.target.value && setRoughnessMm(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Custom value</option>
                {ROUGHNESS_PRESETS.map((p) => (
                  <option key={p.label} value={p.value}>
                    {p.label} ({p.value} mm)
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="any"
                value={roughnessMm}
                onChange={(e) => setRoughnessMm(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </Field>

          <Field label="Volumetric flow rate, Q (L/s)" hint="Drag the slider or type an exact value.">
            <input
              type="number"
              step="any"
              value={flowLps}
              onChange={(e) => setFlowLps(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="range"
              min={0.1}
              max={200}
              step={0.1}
              value={Math.min(200, Math.max(0.1, numberOr(flowLps, 20)))}
              onChange={(e) => setFlowLps(e.target.value)}
              className="mt-2 w-full accent-[var(--primary)]"
            />
          </Field>

          <div className="rounded-xl border border-border/70 bg-background/40 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Operating economics
            </p>
            <div className="mt-3 space-y-3">
              <Field label="Energy price (per kWh)">
                <input
                  type="number"
                  step="0.01"
                  value={energyCost}
                  onChange={(e) => setEnergyCost(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                />
              </Field>
              <Field label="Pump efficiency (%)">
                <input
                  type="number"
                  value={efficiency}
                  onChange={(e) => setEfficiency(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                />
              </Field>
              <Field label="Operating hours per year">
                <input
                  type="number"
                  value={runHours}
                  onChange={(e) => setRunHours(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                />
              </Field>
            </div>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Download className="size-4" /> Export results to CSV
          </button>
        </aside>


        {/* Results */}
        <div className="space-y-6">
          {analysis.error ? (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <span>{analysis.error}</span>
            </div>
          ) : null}

          {r ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Velocity" value={fmt(r.velocity, 3)} unit="m/s" hint="v = Q ÷ A" />
                <Metric
                  label="Reynolds number"
                  value={fmt(r.reynolds, 0)}
                  hint={`${r.regime} · Re = ρvD ÷ μ`}
                />
                <Metric
                  label="Friction factor"
                  value={fmt(r.frictionFactor, 4)}
                  hint={r.reynolds < 2300 ? "Laminar: f = 64 ÷ Re" : "Colebrook–White solution"}
                />

                <Metric
                  label="Pressure drop"
                  value={fmt(r.pressureDrop / 1000, 3)}
                  unit="kPa"
                  hint={`${fmt(r.headLoss, 3)} m head loss`}
                />
              </div>

              {decision ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric
                      label="Erosional limit (API RP 14E)"
                      value={fmt(decision.ve, 2)}
                      unit="m/s"
                      hint={`Operating at ${((r.velocity / decision.ve) * 100).toFixed(0)} % of limit`}
                    />
                    <Metric
                      label="Pressure gradient"
                      value={fmt((decision.gradient * 100 * 0.3048) / 6894.757, 3)}
                      unit="psi/100 ft"
                      hint={`${fmt(decision.gradient / 1000, 4)} kPa/m`}
                    />
                    <Metric
                      label="Friction power"
                      value={fmt(decision.money.shaftPower / 1000, 2)}
                      unit="kW shaft"
                      hint={`${fmt(decision.money.hydraulicPower / 1000, 2)} kW hydraulic`}
                    />
                    <Metric
                      label="Annual pumping cost"
                      value={decision.money.annualCost.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                      hint={`${fmt(decision.money.annualEnergy, 0)} kWh/yr of friction alone`}
                    />
                  </div>

                  <AdvisorPanel advisories={decision.advisories} />
                </>
              ) : null}



              <div className="grid gap-4 md:grid-cols-2">
                <FieldNote title="Reading the Reynolds number">
                  Below <M tex="Re \approx 2300" /> the flow is laminar — typical of heavy or waxy
                  crude in a small flowline, where pressure drop rises only linearly with rate. Above{" "}
                  <M tex="Re \approx 4000" /> it is turbulent, the usual state for produced water,
                  gas and light oil, and <M tex="\Delta P" /> then climbs almost with the square of
                  rate. This run is {r.regime.toLowerCase()}.
                </FieldNote>
                <FieldNote title="Why the pressure drop matters">
                  {`${fmt(r.pressureDrop / 1000, 2)} kPa`} of friction is head your pump or the
                  reservoir must supply. Convert it to hydraulic power with{" "}
                  <M tex="P = Q\,\Delta P" /> to size the driver, and compare the head loss against
                  available wellhead pressure to see whether the line can flow naturally or needs
                  artificial lift.
                </FieldNote>
              </div>


              <div className="panel p-5">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-bold">Pressure drop vs flow rate</h2>
                  <p className="text-xs text-muted-foreground">
                    Sweep from 0 to {fmt(numberOr(flowLps, 0) * 2, 1)} L/s · marker shows the
                    current duty point
                  </p>
                </div>
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analysis.sweep} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="q"
                        stroke="var(--muted-foreground)"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) => v.toFixed(0)}
                        label={{
                          value: "Flow rate Q (L/s)",
                          position: "insideBottom",
                          offset: -12,
                          fill: "var(--muted-foreground)",
                          fontSize: 12,
                        }}
                      />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        tick={{ fontSize: 11 }}
                        width={70}
                        tickFormatter={(v: number) => v.toFixed(1)}
                        label={{
                          value: "ΔP (kPa)",
                          angle: -90,
                          position: "insideLeft",
                          fill: "var(--muted-foreground)",
                          fontSize: 12,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`${v.toFixed(3)} kPa`, "ΔP"]}
                        labelFormatter={(v: number) => `Q = ${Number(v).toFixed(2)} L/s`}
                      />
                      <Line
                        type="monotone"
                        dataKey="dp"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <ReferenceDot
                        x={numberOr(flowLps, 0)}
                        y={r.pressureDrop / 1000}
                        r={5}
                        fill="var(--flame)"
                        stroke="var(--background)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Cross-sectional area, A", `${fmt(r.area * 1e4, 3)} cm²`],
                      ["Relative roughness, ε/D", fmt(r.relativeRoughness, 6)],
                      ["Mass flow rate", `${fmt((fluidResult.fluid?.density ?? 0) * analysis.q, 3)} kg/s`],
                      ["Head loss, hf", `${fmt(r.headLoss, 4)} m of fluid`],
                      ["Pressure gradient", `${fmt(r.pressureDrop / numberOr(lengthM, 1) / 1000, 4)} kPa/m`],
                      ["Flow regime", r.regime],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-3 text-muted-foreground">{k}</td>
                        <td className="px-5 py-3 text-right font-mono text-foreground">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
