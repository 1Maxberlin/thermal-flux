import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Equation } from "@/components/Math";
import { Activity, Flame, Database, ArrowRight, Download, Upload, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "App Manual — How to Use Thermaflux" },
      {
        name: "description",
        content:
          "Step-by-step guide to the Thermaflux pipe flow analyser, heat transfer calculator and rock & fluid data dashboard, including every equation, unit and export option.",
      },
      { property: "og:title", content: "App Manual — Thermaflux" },
      {
        property: "og:description",
        content:
          "How to run a hydraulics case, a cooling case and a core-data study in Thermaflux, with the equations behind each result.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManualPage,
});

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Activity;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel animate-rise p-6 sm:p-7">
      <h2 className="flex items-center gap-3 font-display text-xl font-extrabold sm:text-2xl">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
          <Icon className="size-5" />
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[0.97rem] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function ManualPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="User guide"
        title="App manual"
        description="Everything Thermaflux can do, in the order you would normally use it. Each tool recalculates the moment an input changes — there is no run button to press — and every screen can export its numbers as CSV."
      />

      <div className="space-y-6">
        <Card icon={SlidersHorizontal} title="Getting started">
          <ul className="ml-5 list-disc space-y-2">
            <li>Pick a tool from the top navigation (on a phone, tap the menu button).</li>
            <li>Type values directly, or drag the sliders for a feel of how sensitive a result is.</li>
            <li>
              Use the sun / moon button to switch between light and dark themes — your choice is
              remembered on this device.
            </li>
            <li>
              Bad input never crashes the app: an inline red panel explains exactly which value is
              out of range.
            </li>
          </ul>
        </Card>

        <Card icon={Activity} title="Pipe flow analyser">
          <p>
            Enter the fluid (or type your own density and viscosity), the internal diameter, the
            developed length, the wall roughness and the flow rate. The tool returns bulk velocity,
            Reynolds number, Darcy friction factor, pressure drop and head loss, and sweeps flow
            rate to show how pressure drop grows.
          </p>
          <Equation tex="v=\frac{Q}{A},\qquad Re=\frac{\rho v D}{\mu},\qquad \Delta P=f\,\frac{L}{D}\,\frac{\rho v^{2}}{2}" />
          <p>
            Laminar flow uses <em>f</em> = 64/Re; turbulent flow solves the implicit Colebrook–White
            equation iteratively, with a smooth blend across the transition band.
          </p>
          <p className="flex items-center gap-2 text-foreground">
            <Download className="size-4 text-primary" /> “Export results to CSV” writes both the
            input sheet and the full sweep table.
          </p>
          <Link
            to="/pipe-flow"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Open the analyser <ArrowRight className="size-4" />
          </Link>
        </Card>

        <Card icon={Flame} title="Heat transfer calculator">
          <p>
            The upper panel solves steady conduction through a flat wall; the lower panel solves
            transient lumped-capacitance cooling and draws the temperature history live.
          </p>
          <Equation tex="q=\frac{k\,A\,(T_{h}-T_{c})}{L},\qquad T(t)=T_{\infty}+(T_{0}-T_{\infty})e^{-t/\tau},\qquad \tau=\frac{\rho V c_{p}}{hA}" />
          <p>
            If your target temperature lies beyond the ambient temperature it can never be reached,
            and the app says so instead of returning a meaningless number.
          </p>
          <Link
            to="/heat-transfer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Open the calculator <ArrowRight className="size-4" />
          </Link>
        </Card>

        <Card icon={Database} title="Rock & fluid data dashboard">
          <p className="flex items-start gap-2">
            <Upload className="mt-1 size-4 shrink-0 text-primary" />
            Upload any CSV whose first row holds column names. Porosity and permeability columns are
            detected automatically and can be reassigned. Apply cut-offs, filter by rock type, read
            the summary statistics, and inspect the histogram and the log-scale porosity–permeability
            crossplot.
          </p>
          <p>
            No dataset to hand? Load the built-in 90-plug demo set, which follows a realistic
            Kozeny-type porosity–permeability trend.
          </p>
          <Link
            to="/data-dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Open the dashboard <ArrowRight className="size-4" />
          </Link>
        </Card>

        <Card icon={Download} title="Units, accuracy and exports">
          <ul className="ml-5 list-disc space-y-2">
            <li>All internal physics is in SI; convenience units (mm, L/s, kPa, minutes) are converted at the edge.</li>
            <li>Correlations are single-phase and isothermal; two-phase flow, minor losses and fittings are not included.</li>
            <li>Exported CSV files open directly in Excel and match the numbers shown on screen to the displayed precision.</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
