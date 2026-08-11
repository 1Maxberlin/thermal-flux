import { AlertTriangle, CheckCircle2, Info, ShieldAlert, Lightbulb } from "lucide-react";
import type { Advisory, Severity } from "@/lib/advisor";

const STYLES: Record<
  Severity,
  { ring: string; text: string; bg: string; icon: typeof Info; label: string }
> = {
  critical: {
    ring: "ring-flame/40",
    text: "text-flame",
    bg: "bg-flame/10",
    icon: ShieldAlert,
    label: "Action required",
  },
  warn: {
    ring: "ring-amber/40",
    text: "text-amber",
    bg: "bg-amber/10",
    icon: AlertTriangle,
    label: "Review",
  },
  info: {
    ring: "ring-primary/30",
    text: "text-primary",
    bg: "bg-primary/10",
    icon: Info,
    label: "Note",
  },
  good: {
    ring: "ring-mint/35",
    text: "text-mint",
    bg: "bg-mint/10",
    icon: CheckCircle2,
    label: "Acceptable",
  },
};

export function AdvisoryCard({ advisory }: { advisory: Advisory }) {
  const s = STYLES[advisory.severity];
  const Icon = s.icon;
  return (
    <li
      className={`animate-rise rounded-xl p-4 ring-1 ${s.bg} ${s.ring} transition-transform duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 size-5 shrink-0 ${s.text}`} />
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${s.text}`}>{s.label}</p>
          <h4 className="mt-1 text-[0.98rem] font-semibold leading-snug text-foreground">
            {advisory.title}
          </h4>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{advisory.detail}</p>
          {advisory.action ? (
            <p className="mt-2 flex items-start gap-2 text-sm font-medium text-foreground">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber" />
              <span>{advisory.action}</span>
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/** Ranked decision-support panel shown beneath each calculator. */
export function AdvisorPanel({
  advisories,
  title = "Decision advisor",
  subtitle = "Ranked engineering guidance generated from the current case — most urgent first.",
}: {
  advisories: Advisory[];
  title?: string;
  subtitle?: string;
}) {
  if (advisories.length === 0) return null;
  const critical = advisories.filter((a) => a.severity === "critical").length;
  const warn = advisories.filter((a) => a.severity === "warn").length;

  return (
    <section className="panel p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-extrabold sm:text-xl">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {critical > 0 ? (
            <span className="rounded-full bg-flame/12 px-3 py-1 text-xs font-bold text-flame ring-1 ring-flame/30">
              {critical} critical
            </span>
          ) : null}
          {warn > 0 ? (
            <span className="rounded-full bg-amber/12 px-3 py-1 text-xs font-bold text-amber ring-1 ring-amber/30">
              {warn} to review
            </span>
          ) : null}
          {critical === 0 && warn === 0 ? (
            <span className="rounded-full bg-mint/12 px-3 py-1 text-xs font-bold text-mint ring-1 ring-mint/30">
              All checks pass
            </span>
          ) : null}
        </div>
      </div>
      <ul className="mt-4 grid gap-3 lg:grid-cols-2">
        {advisories.map((a) => (
          <AdvisoryCard key={a.id} advisory={a} />
        ))}
      </ul>
    </section>
  );
}
