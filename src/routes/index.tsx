import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Flame, Database, ArrowRight, CheckCircle2, BookOpen, Waves, Gauge, LineChart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Equation } from "@/components/Math";
import heroVideo from "@/assets/hero-background.mp4.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Thermaflux — Pipe Flow, Heat Transfer & Core Data Analysis" },
      {
        name: "description",
        content:
          "Thermaflux is an engineering studio for single-phase pipe hydraulics, conduction and cooling calculations, and rock & fluid data exploration — with verifiable physics and CSV export.",
      },
      { property: "og:title", content: "Thermaflux — Flow & Thermal Engineering Studio" },
      {
        property: "og:description",
        content:
          "Size a line, predict a pressure drop, check how fast a vessel cools and interrogate core-analysis data in one fast, transparent toolkit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TOOLS = [
  {
    to: "/pipe-flow",
    icon: Activity,
    title: "Pipe Flow Analyser",
    body: "Fluid library with auto-populated properties, Darcy–Weisbach pressure drop, Colebrook friction factor, sweep plot and CSV export.",
    points: ["Velocity, Re, f and ΔP", "ΔP vs Q sweep chart", "One-click CSV export"],
  },
  {
    to: "/heat-transfer",
    icon: Flame,
    title: "Heat Transfer Calculator",
    body: "Fourier conduction through a flat wall plus lumped-capacitance cooling with a live temperature-versus-time curve.",
    points: ["Wall heat loss and flux", "Time to reach a target", "Real-time cooling curve"],
  },
  {
    to: "/data-dashboard",
    icon: Database,
    title: "Rock & Fluid Dashboard",
    body: "Upload a core-analysis CSV, review summary statistics, filter on cut-offs and export exactly the rows you kept.",
    points: ["CSV upload and preview", "Histogram and crossplot", "Filtered CSV download"],
  },
  {
    to: "/manual",
    icon: BookOpen,
    title: "App Manual",
    body: "A short guide to every screen: which inputs matter, which equations run underneath and how the exports are structured.",
    points: ["Step-by-step workflows", "Equations in full", "Units and assumptions"],
  },
] as const;

const STATS = [
  { icon: Gauge, value: "4", label: "Live engineering tools" },
  { icon: Waves, value: "10⁻⁶", label: "Colebrook solver tolerance" },
  { icon: LineChart, value: "Instant", label: "Recalculation on every input" },
];

function Index() {
  return (
    <AppShell bleed>
      {/* Hero with looping background video */}
      <section className="group relative isolate overflow-hidden">
        <video
          className="absolute inset-0 -z-20 size-full object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90 dark:opacity-55 dark:group-hover:opacity-75"
          src={heroVideo.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/85 to-background/45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-background/60" />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/70 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary backdrop-blur">
              <Waves className="size-3.5" /> Flow &amp; thermal engineering studio
            </p>
            <h1 className="animate-rise mt-5 text-4xl font-extrabold leading-[1.06] sm:text-5xl lg:text-6xl" style={{ animationDelay: "70ms" }}>
              Fluid Flow &amp; Heat Transfer{" "}
              <span className="text-gradient">Engineering Suite</span>
            </h1>
            <p
              className="animate-rise mt-6 max-w-2xl text-lg leading-relaxed text-foreground/85 sm:text-xl"
              style={{ animationDelay: "140ms" }}
            >
              A working engineering toolkit for petroleum and process engineers: size a line,
              predict a pressure drop, check how fast a vessel cools, and interrogate core-analysis
              data — all with transparent, verifiable physics and exportable results.
            </p>
            <div className="animate-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "210ms" }}>
              <Link
                to="/pipe-flow"
                className="sheen inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Launch Pipe Flow Analyser <ArrowRight className="size-5" />
              </Link>
              <Link
                to="/manual"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-6 py-3.5 text-base font-bold text-foreground backdrop-blur transition-colors hover:bg-accent"
              >
                Read the manual
              </Link>
            </div>

            <dl className="animate-rise mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3" style={{ animationDelay: "280ms" }}>
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border/80 bg-background/70 p-4 backdrop-blur"
                >
                  <s.icon className="size-5 text-primary" />
                  <dt className="mt-2 font-display text-xl font-extrabold">{s.value}</dt>
                  <dd className="text-sm text-muted-foreground">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <section className="grid gap-5 md:grid-cols-2">
          {TOOLS.map((m, i) => (
            <Link
              key={m.to}
              to={m.to}
              className="animate-rise panel group block p-6 transition-transform hover:-translate-y-1.5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25 transition-transform group-hover:scale-110">
                  <m.icon className="size-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold sm:text-2xl">{m.title}</h2>
                  <p className="mt-2 text-[0.97rem] leading-relaxed text-muted-foreground">{m.body}</p>
                  <ul className="mt-4 space-y-2">
                    {m.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                    Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="panel animate-rise mt-8 p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold">The physics, written out</h2>
          <p className="mt-2 max-w-3xl text-[0.97rem] leading-relaxed text-muted-foreground">
            Nothing here is a black box. These are the three relationships driving every number the
            app produces, rendered exactly as you would write them on paper.
          </p>
          <div className="mt-4 grid gap-5 lg:grid-cols-3">
            <div>
              <Equation tex="\Delta P = f\,\frac{L}{D}\,\frac{\rho v^{2}}{2}" caption="Darcy–Weisbach pressure drop" />
            </div>
            <div>
              <Equation tex="\frac{1}{\sqrt{f}} = -2\log_{10}\!\left(\frac{\varepsilon/D}{3.7}+\frac{2.51}{Re\sqrt{f}}\right)" caption="Colebrook–White friction factor" />
            </div>
            <div>
              <Equation tex="T(t) = T_{\infty} + (T_{0}-T_{\infty})\,e^{-t/\tau}" caption="Newton cooling, lumped capacitance" />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
