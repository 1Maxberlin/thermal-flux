import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Activity, Flame, Database, Gauge, BookOpen, Menu, X } from "lucide-react";
import { Logo, Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { to: "/", label: "Home", icon: Gauge },
  { to: "/pipe-flow", label: "Pipe Flow", icon: Activity },
  { to: "/heat-transfer", label: "Heat Transfer", icon: Flame },
  { to: "/data-dashboard", label: "Rock & Fluid Data", icon: Database },
  { to: "/manual", label: "Manual", icon: BookOpen },
] as const;

export function AppShell({ children, bleed = false }: { children: ReactNode; bleed?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen hero-surface">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:flex lg:gap-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
            <Logo className="size-10 shrink-0" />
            <Wordmark />
          </Link>

          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[0.95rem] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <Icon className="size-4 opacity-85" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-secondary lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <nav className="animate-rise border-t border-border bg-background/95 px-4 pb-4 pt-2 lg:hidden">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className={bleed ? "" : "mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10"}>{children}</main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="size-8" />
            <span>
              <span className="font-display font-bold text-foreground">Thermaflux</span> — flow,
              thermal and reservoir-data analysis with transparent physics.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/manual" className="transition-colors hover:text-foreground">
              Manual
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="animate-rise mb-8">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl lg:text-[2.75rem]">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">{description}</p>
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
    <div className="metric-card min-w-0 p-4">
      <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-display text-2xl font-extrabold text-foreground sm:text-[1.75rem]">
        {value}
        {unit ? <span className="ml-1 text-base font-semibold text-primary">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[0.95rem] font-semibold text-foreground">{label}</label>
      {children}
      {hint ? <p className="text-xs leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
