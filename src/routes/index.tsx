import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Flame, Database, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlowThermal Suite — Pipe Flow & Heat Transfer Engineering Tools" },
      {
        name: "description",
        content:
          "An engineering web suite for single-phase pipe flow analysis, conduction and cooling calculations, and rock & fluid data exploration with CSV export.",
      },
      { property: "og:title", content: "FlowThermal Suite — Engineering Analysis Toolkit" },
      {
        property: "og:description",
        content:
          "Pipe flow analyser, heat transfer calculator and rock/fluid data dashboard in one deployed engineering application.",
      },
    ],
  }),
  component: Index,
});

const MODULES = [
  {
    to: "/pipe-flow",
    icon: Activity,
    tag: "Module A",
    title: "Pipe Flow Analyser",
    body: "Fluid library with auto-populated properties, Darcy–Weisbach pressure drop, Colebrook friction factor, sweep plot and CSV export.",
    points: ["Velocity, Re, f, ΔP", "ΔP vs Q sweep chart", "One-click CSV export"],
  },
  {
    to: "/heat-transfer",
    icon: Flame,
    tag: "Module B",
    title: "Heat Transfer Calculator",
    body: "Fourier conduction through a flat wall plus lumped-capacitance Newton cooling with a live temperature-vs-time curve.",
    points: ["Fourier's law wall conduction", "Time to reach target temp", "Real-time cooling curve"],
  },
  {
    to: "/data-dashboard",
    icon: Database,
    tag: "Module C",
    title: "Rock & Fluid Dashboard",
    body: "Upload a core-analysis CSV, review summary statistics, filter by porosity or permeability and export the filtered set.",
    points: ["CSV upload + preview", "Histogram & crossplot", "Filtered CSV download"],
  },
  {
    to: "/documentation",
    icon: BookOpen,
    tag: "Module D",
    title: "Code Quality & Docs",
    body: "OOP model, verification against hand calculations, deployment notes, git history and a full AI-usage log.",
    points: ["Fluid / Pipe classes", "Verification worked examples", "3 documented AI prompts"],
  },
];

function Index() {
  return (
    <AppShell>
      <section className="animate-rise panel relative overflow-hidden p-8 sm:p-12">
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            PE 262 · Capstone Project
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.08] sm:text-5xl">
            Fluid Flow &amp; Heat Transfer{" "}
            <span className="text-gradient">Engineering Suite</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            A working engineering toolkit for petroleum and process engineers: size a line, predict
            a pressure drop, check how fast a vessel cools, and interrogate core-analysis data —
            all with transparent, verifiable physics and exportable results.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/pipe-flow"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Launch Pipe Flow Analyser <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/documentation"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Verification &amp; AI log
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {MODULES.map((m, i) => (
          <Link
            key={m.to}
            to={m.to}
            className="animate-rise panel group block p-6 transition-transform hover:-translate-y-1"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
                <m.icon className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-flame">
                  {m.tag}
                </p>
                <h2 className="mt-1 text-xl font-bold">{m.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                <ul className="mt-4 space-y-1.5">
                  {m.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
