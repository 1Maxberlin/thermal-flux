import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Activity, Flame, Database, BookOpen, Gauge } from "lucide-react";

const NAV = [
  { to: "/", label: "Overview", icon: Gauge },
  { to: "/pipe-flow", label: "Pipe Flow", icon: Activity },
  { to: "/heat-transfer", label: "Heat Transfer", icon: Flame },
  { to: "/data-dashboard", label: "Rock & Fluid Data", icon: Database },
  { to: "/documentation", label: "Docs & AI Log", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen hero-surface">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
              <Gauge className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-bold tracking-tight">
                FlowThermal Suite
              </span>
              <span className="block text-[11px] text-muted-foreground">PE 262 · Capstone</span>
            </span>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <Icon className="size-4 opacity-80" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs text-muted-foreground sm:px-6">
        Fluid Flow &amp; Heat Transfer Engineering Suite — built for PE 262 Capstone. All
        correlations verified against hand calculations; see Docs &amp; AI Log.
      </footer>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="animate-rise mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function Metric({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string | undefined;
  hint?: string | undefined;
}) {
  return (
    <div className="metric-card p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-display text-2xl font-bold text-foreground">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-primary">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint ? <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
