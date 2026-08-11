import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Download } from "lucide-react";
import { AppShell, Field, Metric, PageHeader } from "@/components/AppShell";
import { Equation, FieldNote, M } from "@/components/Math";
import { AdvisorPanel } from "@/components/Advisor";
import { biotNumber, conductionAdvisories, coolingAdvisories } from "@/lib/advisor";

import { conductionThroughWall, downloadFile, fmt, newtonCooling, toCsv } from "@/lib/engineering";
import { toast } from "sonner";

export const Route = createFileRoute("/heat-transfer")({
  head: () => ({
    meta: [
      { title: "Heat Transfer Calculator — Wall Conduction & Newton Cooling" },
      {
        name: "description",
        content:
          "Steady-state Fourier conduction through a flat wall plus lumped-capacitance Newton cooling with a live temperature-versus-time curve and CSV export.",
      },
      { property: "og:title", content: "Heat Transfer Calculator — FlowThermal Suite" },
      {
        property: "og:description",
        content:
          "Compute wall heat flux with Fourier's law and cooling time with Newton's law of cooling, plotted in real time.",
      },
    ],
  }),
  component: HeatTransferPage,
});

const MATERIALS = [
  { label: "Carbon steel", k: 45 },
  { label: "Stainless steel 304", k: 16 },
  { label: "Concrete", k: 1.4 },
  { label: "Sandstone", k: 2.8 },
  { label: "Glass wool insulation", k: 0.04 },
  { label: "Polyurethane foam", k: 0.026 },
];

const num = (s: string, fallback = NaN) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
};

function Slider({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  return (
    <Field label={`${label} (${unit})`} hint={hint}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, num(value, min)))}
          onChange={(e) => onChange(e.target.value)}
          className="w-full accent-[var(--primary)]"
        />
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 shrink-0 rounded-md border border-input bg-background px-2 py-1.5 text-right text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </Field>
  );
}

function HeatTransferPage() {
  // Conduction inputs
  const [k, setK] = useState("45");
  const [area, setArea] = useState("2.5");
  const [thickness, setThickness] = useState("0.012");
  const [tHot, setTHot] = useState("180");
  const [tCold, setTCold] = useState("40");

  // Cooling inputs
  const [t0, setT0] = useState("90");
  const [tInf, setTInf] = useState("25");
  const [tTarget, setTTarget] = useState("40");
  const [h, setH] = useState("25");
  const [coolArea, setCoolArea] = useState("0.6");
  const [volume, setVolume] = useState("0.02");
  const [density, setDensity] = useState("998");
  const [cp, setCp] = useState("4182");

  const conduction = useMemo(() => {
    try {
      return {
        data: conductionThroughWall(
          num(k),
          num(area),
          num(thickness),
          num(tHot),
          num(tCold),
        ),
        error: null as string | null,
      };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  }, [k, area, thickness, tHot, tCold]);

  const cooling = useMemo(() => {
    try {
      const res = newtonCooling({
        t0: num(t0),
        tInf: num(tInf),
        tTarget: num(tTarget),
        h: num(h),
        area: num(coolArea),
        volume: num(volume),
        density: num(density),
        cp: num(cp),
      });
      const horizon = Math.max((res.timeToTarget ?? res.tau * 3) * 1.5, res.tau * 0.5, 1);
      const curve = Array.from({ length: 120 }, (_, i) => {
        const t = (horizon * i) / 119;
        return { t: t / 60, temp: res.temperatureAt(t) };
      });
      return { res, curve, error: null as string | null };
    } catch (e) {
      return { res: null, curve: [], error: (e as Error).message };
    }
  }, [t0, tInf, tTarget, h, coolArea, volume, density, cp]);

  const exportCooling = () => {
    if (!cooling.res) {
      toast.error("Fix the input errors before exporting.");
      return;
    }
    const csv = toCsv(
      ["Time (min)", "Temperature (degC)"],
      cooling.curve.map((p) => [p.t.toFixed(4), p.temp.toFixed(4)]),
    );
    downloadFile("cooling_curve.csv", csv);
    toast.success("Cooling curve exported to cooling_curve.csv");
  };

  const c = conduction.data;
  const cool = cooling.res;

  // Flow-assurance context for the cooling advisor
  const [riskTemp, setRiskTemp] = useState("35");
  const [responseHours, setResponseHours] = useState("4");

  const conductionAdvice = useMemo(
    () =>
      c
        ? conductionAdvisories({
            heatRate: c.heatRate,
            heatFlux: c.heatFlux,
            k: num(k),
            thickness: num(thickness),
            tHot: num(tHot),
            tCold: num(tCold),
          })
        : [],
    [c, k, thickness, tHot, tCold],
  );

  /** How heat flux and annual loss respond to insulation thickness. */
  const thicknessSweep = useMemo(() => {
    if (!c) return [];
    const base = Math.max(num(thickness), 1e-4);
    return Array.from({ length: 40 }, (_, i) => {
      const L = base * (0.25 + (i * 3.75) / 39);
      const flux = (num(k) * Math.abs(num(tHot) - num(tCold))) / L;
      return { L: L * 1000, flux, kw: (flux * num(area)) / 1000 };
    });
  }, [c, thickness, k, tHot, tCold, area]);

  const coolingAdvice = useMemo(() => {
    if (!cool) return [];
    return coolingAdvisories({
      tau: cool.tau,
      timeToTarget: cool.timeToTarget,
      t0: num(t0),
      tInf: num(tInf),
      tTarget: num(tTarget),
      biot: biotNumber(num(h), num(volume), num(coolArea), num(k)),
      riskTemp: num(riskTemp),
      responseHours: Math.max(0.25, num(responseHours)),
      temperatureAt: cool.temperatureAt,
    });
  }, [cool, t0, tInf, tTarget, h, volume, coolArea, k, riskTemp, responseHours]);


  return (
    <AppShell>
      <PageHeader
        eyebrow="Thermal analysis"
        title="Heat Transfer Calculator"
        description="Two classical results, side by side: steady one-dimensional conduction through a flat wall, and transient lumped-capacitance cooling of a body in a constant ambient. Every input is described physically, with its unit."
      />

      {/* Conduction */}
      <section className="panel p-5 sm:p-6">
        <h2 className="font-display text-xl font-extrabold sm:text-2xl">
          Steady-state conduction through a flat wall
        </h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Equation
            tex="q=\dfrac{k\,A\,(T_{h}-T_{c})}{L},\qquad R_{th}=\dfrac{L}{kA}"
            caption="Fourier's law for one homogeneous layer"
          />
          <FieldNote>
            This is the calculation behind insulating a separator, a stock tank or a steam line. Heat
            lost through the wall cools the crude, and cool crude drops wax and asphaltene onto the
            pipe wall and thickens up so the pumps work harder. Trading a thicker jacket (larger{" "}
            <M tex="L" />) or a lower-conductivity material (smaller <M tex="k" />) against its cost
            is the everyday insulation-sizing decision.
          </FieldNote>
        </div>


        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <Field
              label="Wall material"
              hint="Sets the thermal conductivity k. Choose 'Custom' by editing the value below."
            >
              <select
                value={MATERIALS.some((m) => String(m.k) === k) ? k : ""}
                onChange={(e) => e.target.value && setK(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Custom material</option>
                {MATERIALS.map((m) => (
                  <option key={m.label} value={m.k}>
                    {m.label} (k = {m.k} W/m·K)
                  </option>
                ))}
              </select>
            </Field>
            <Slider
              label="Thermal conductivity, k"
              hint="How readily the wall material conducts heat. Metals are high (10–400); insulation is very low (0.02–0.06)."
              unit="W/m·K"
              value={k}
              onChange={setK}
              min={0.01}
              max={400}
              step={0.01}
            />
            <Slider
              label="Wall surface area, A"
              hint="The area of wall through which heat flows, measured perpendicular to the heat flow direction."
              unit="m²"
              value={area}
              onChange={setArea}
              min={0.01}
              max={50}
              step={0.01}
            />
            <Slider
              label="Wall thickness, L"
              hint="Distance heat must travel through the wall. Thicker wall = more resistance = less heat loss."
              unit="m"
              value={thickness}
              onChange={setThickness}
              min={0.001}
              max={1}
              step={0.001}
            />
            <div className="grid grid-cols-2 gap-4">
              <Slider
                label="Hot-side temperature"
                hint="Temperature of the surface in contact with the hot fluid."
                unit="°C"
                value={tHot}
                onChange={setTHot}
                min={-50}
                max={800}
                step={1}
              />
              <Slider
                label="Cold-side temperature"
                hint="Temperature of the outer/cold surface of the wall."
                unit="°C"
                value={tCold}
                onChange={setTCold}
                min={-100}
                max={800}
                step={1}
              />
            </div>
          </div>

          <div className="space-y-4">
            {conduction.error ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span>{conduction.error}</span>
              </div>
            ) : c ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Metric
                    label="Heat transfer rate, q"
                    value={fmt(c.heatRate, 1)}
                    unit="W"
                    hint={`${fmt(c.heatRate / 1000, 3)} kW`}
                  />
                  <Metric label="Heat flux, q″" value={fmt(c.heatFlux, 1)} unit="W/m²" />
                  <Metric
                    label="Thermal resistance"
                    value={fmt(c.resistance, 5)}
                    unit="K/W"
                    hint="R = L ÷ (k·A)"
                  />
                  <Metric label="Driving ΔT" value={fmt(c.deltaT, 2)} unit="K" />
                </div>
                <div className="rounded-xl border border-border bg-background/40 p-4 text-[0.95rem] leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Reading the result:</strong> heat flows from
                  hot to cold. A negative q simply means the “cold” side is actually hotter. Halving
                  the thickness doubles the loss; swapping steel for foam insulation of the same
                  thickness cuts it by roughly three orders of magnitude.
                </div>
              </>
            ) : null}
          </div>
        </div>

        {c ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border/70 bg-background/40 p-4 sm:p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 sm:flex sm:justify-between">
                <h3 className="min-w-0 font-display text-base font-bold">
                  Insulation thickness study
                </h3>
                <p className="shrink-0 text-xs text-muted-foreground">
                  Flux target for insulated equipment ≈ 100 W/m²
                </p>
              </div>
              <div className="mt-3 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={thicknessSweep} margin={{ top: 8, right: 12, bottom: 22, left: 4 }}>
                    <defs>
                      <linearGradient id="fluxFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="L"
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) => v.toFixed(0)}
                      label={{
                        value: "Thickness (mm)",
                        position: "insideBottom",
                        offset: -12,
                        fill: "var(--muted-foreground)",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 11 }}
                      width={64}
                      tickFormatter={(v: number) => v.toFixed(0)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v.toFixed(1)} W/m²`, "Heat flux"]}
                      labelFormatter={(v: number) => `L = ${Number(v).toFixed(1)} mm`}
                    />
                    <Area
                      type="monotone"
                      dataKey="flux"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      fill="url(#fluxFill)"
                      isAnimationActive={false}
                    />
                    <ReferenceLine y={100} stroke="var(--flame)" strokeDasharray="5 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <AdvisorPanel
              advisories={conductionAdvice}
              title="Insulation decision advisor"
              subtitle="What this heat loss costs, and whether the wall needs a jacket."
            />
          </div>
        ) : null}
      </section>


      {/* Cooling */}
      <section className="panel mt-6 p-5 sm:p-6">
        <h2 className="font-display text-xl font-extrabold sm:text-2xl">
          Newton cooling — time to reach a target temperature
        </h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Equation
            tex="T(t)=T_{\infty}+(T_{0}-T_{\infty})\,e^{-t/\tau},\qquad \tau=\dfrac{\rho V c_{p}}{hA}"
            caption="Lumped-capacitance cooling — the curve updates as you drag any slider"
          />
          <FieldNote>
            Shut-in cool-down is a real operating risk. Once a stagnant flowline drops below the wax
            appearance or hydrate formation temperature, you are looking at a plug and a costly
            remediation job. The time constant <M tex="\tau" /> tells you how long the no-touch
            window is; increasing insulation (lowering <M tex="h" />) or thermal mass{" "}
            <M tex="\rho V c_p" /> stretches it.
          </FieldNote>
        </div>


        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <Slider
              label="Initial temperature, T₀"
              hint="Temperature of the object at the start of cooling (t = 0)."
              unit="°C"
              value={t0}
              onChange={setT0}
              min={-50}
              max={400}
              step={1}
            />
            <Slider
              label="Ambient temperature, T∞"
              hint="Temperature of the surrounding air or water. The object can never cool below this."
              unit="°C"
              value={tInf}
              onChange={setTInf}
              min={-50}
              max={200}
              step={1}
            />
            <Slider
              label="Target temperature"
              hint="The temperature you want to reach — must lie between T₀ and T∞."
              unit="°C"
              value={tTarget}
              onChange={setTTarget}
              min={-50}
              max={400}
              step={1}
            />
            <Slider
              label="Convection coefficient, h"
              hint="How effectively the surroundings carry heat away. Still air ≈ 5–25, forced air ≈ 25–250, water ≈ 500–10 000."
              unit="W/m²·K"
              value={h}
              onChange={setH}
              min={1}
              max={1000}
              step={1}
            />
            <Slider
              label="Exposed surface area, A"
              hint="Outer area of the object in contact with the ambient fluid."
              unit="m²"
              value={coolArea}
              onChange={setCoolArea}
              min={0.001}
              max={20}
              step={0.001}
            />
            <Slider
              label="Body volume, V"
              hint="Volume of material that must give up its stored heat. Larger volume = slower cooling."
              unit="m³"
              value={volume}
              onChange={setVolume}
              min={0.0001}
              max={5}
              step={0.0001}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Density ρ (kg/m³)" hint="Mass per unit volume of the body.">
                <input
                  type="number"
                  value={density}
                  onChange={(e) => setDensity(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field label="Specific heat c_p (J/kg·K)" hint="Energy to raise 1 kg by 1 K.">
                <input
                  type="number"
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            </div>
            <button
              onClick={exportCooling}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <Download className="size-4" /> Export cooling curve (CSV)
            </button>
          </div>

          <div className="space-y-4">
            {cooling.error ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span>{cooling.error}</span>
              </div>
            ) : cool ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Metric
                    label="Thermal time constant"
                    value={fmt(cool.tau / 60, 2)}
                    unit="min"
                    hint={`${fmt(cool.tau, 0)} s — 63 % of the change`}
                  />
                  <Metric
                    label="Time to target"
                    value={cool.timeToTarget !== null ? fmt(cool.timeToTarget / 60, 2) : "—"}
                    unit={cool.timeToTarget !== null ? "min" : undefined}
                    hint={
                      cool.timeToTarget !== null
                        ? `${fmt(cool.timeToTarget, 0)} s`
                        : cool.note
                    }
                  />
                  <Metric
                    label="Practically settled (5τ)"
                    value={fmt((5 * cool.tau) / 60, 1)}
                    unit="min"
                    hint="> 99 % of the temperature change complete"
                  />
                </div>

                <div className="panel p-4">
                  <h3 className="mb-3 font-display text-base font-bold">Cooling curve</h3>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={cooling.curve}
                        margin={{ top: 8, right: 16, bottom: 24, left: 8 }}
                      >
                        <defs>
                          <linearGradient id="coolFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--flame)" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="var(--flame)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="t"
                          stroke="var(--muted-foreground)"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v: number) => v.toFixed(1)}
                          label={{
                            value: "Time (minutes)",
                            position: "insideBottom",
                            offset: -12,
                            fill: "var(--muted-foreground)",
                            fontSize: 12,
                          }}
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          tick={{ fontSize: 11 }}
                          width={60}
                          domain={["auto", "auto"]}
                          tickFormatter={(v: number) => v.toFixed(0)}
                          label={{
                            value: "Temperature (°C)",
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
                          formatter={(v: number) => [`${v.toFixed(2)} °C`, "T"]}
                          labelFormatter={(v: number) => `t = ${Number(v).toFixed(2)} min`}
                        />
                        <Area
                          type="monotone"
                          dataKey="temp"
                          stroke="var(--flame)"
                          strokeWidth={2.5}
                          fill="url(#coolFill)"
                          isAnimationActive={false}
                        />
                        <ReferenceLine
                          y={num(tInf)}
                          stroke="var(--primary)"
                          strokeDasharray="4 4"
                          label={{
                            value: "Ambient T∞",
                            fill: "var(--primary)",
                            fontSize: 11,
                            position: "insideTopRight",
                          }}
                        />
                        <ReferenceLine
                          y={num(tTarget)}
                          stroke="var(--muted-foreground)"
                          strokeDasharray="2 4"
                          label={{
                            value: "Target",
                            fill: "var(--muted-foreground)",
                            fontSize: 11,
                            position: "insideBottomRight",
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {cool.timeToTarget === null && cool.note ? (
                    <p className="mt-2 text-xs text-flame">{cool.note}</p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {cool ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 rounded-2xl border border-border/70 bg-background/40 p-4 sm:grid-cols-2 sm:p-5">
              <Field
                label="Flow-assurance risk temperature (°C)"
                hint="Wax appearance or hydrate formation temperature for this fluid"
              >
                <input
                  type="number"
                  value={riskTemp}
                  onChange={(e) => setRiskTemp(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field
                label="Available response time (h)"
                hint="How long the crew realistically needs to intervene after a shutdown"
              >
                <input
                  type="number"
                  step="0.5"
                  value={responseHours}
                  onChange={(e) => setResponseHours(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            </div>
            <AdvisorPanel
              advisories={coolingAdvice}
              title="Cool-down & flow-assurance advisor"
              subtitle="Whether the system survives an unplanned shutdown, and whether the lumped model can be trusted."
            />
          </div>
        ) : null}
      </section>

    </AppShell>
  );
}
