import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AlertTriangle, Download, FileUp, Sparkles } from "lucide-react";
import { AppShell, Field, Metric, PageHeader } from "@/components/AppShell";
import { downloadFile, fmt, toCsv } from "@/lib/engineering";
import { toast } from "sonner";

export const Route = createFileRoute("/data-dashboard")({
  head: () => ({
    meta: [
      { title: "Rock & Fluid Data Dashboard — CSV Statistics, Filtering & Crossplots" },
      {
        name: "description",
        content:
          "Upload core-analysis or fluid CSV data, review summary statistics, filter by porosity or permeability, view a histogram and porosity–permeability crossplot, and export the filtered set.",
      },
      { property: "og:title", content: "Rock & Fluid Data Dashboard — FlowThermal Suite" },
      {
        property: "og:description",
        content:
          "Interactive CSV dashboard for rock and fluid datasets with summary statistics, filtering and downloadable results.",
      },
    ],
  }),
  component: DashboardPage,
});

type Row = Record<string, string | number>;

/** Parse a CSV string into typed rows, coercing numeric-looking fields to numbers. */
function parseCsv(text: string): { headers: string[]; rows: Row[] } {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("The CSV needs a header row and at least one data row.");
  const splitLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = !quoted;
      } else if (ch === "," && !quoted) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = splitLine(lines[0]!);
  const rows = lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Row = {};
    headers.forEach((hd, i) => {
      const raw = cells[i] ?? "";
      const n = Number(raw);
      row[hd] = raw !== "" && Number.isFinite(n) ? n : raw;
    });
    return row;
  });
  return { headers, rows };
}

/** Deterministic pseudo-random generator so the demo dataset is reproducible. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a realistic synthetic core-analysis dataset (Kozeny-style phi–k trend). */
function sampleDataset(): string {
  const rnd = mulberry32(2026);
  const facies = ["Fine sandstone", "Coarse sandstone", "Shaly sand", "Carbonate"];
  const rows: (string | number)[][] = [];
  for (let i = 1; i <= 90; i++) {
    const phi = 3 + rnd() * 27; // %
    const noise = Math.exp((rnd() - 0.5) * 1.4);
    const perm = Math.max(0.01, 0.0001 * Math.pow(phi, 4.2) * noise); // mD
    rows.push([
      `CORE-${String(i).padStart(3, "0")}`,
      (1500 + i * 12.5 + rnd() * 6).toFixed(1),
      phi.toFixed(2),
      perm.toFixed(3),
      (1.9 + (30 - phi) * 0.025 + rnd() * 0.05).toFixed(3),
      (12 + rnd() * 30).toFixed(1),
      facies[Math.floor(rnd() * facies.length)]!,
    ]);
  }
  return toCsv(
    [
      "sample_id",
      "depth_m",
      "porosity_pct",
      "permeability_mD",
      "grain_density_gcc",
      "water_saturation_pct",
      "facies",
    ],
    rows,
  );
}

function stats(values: number[]) {
  const n = values.length;
  if (n === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n > 1 ? n - 1 : 1);
  const q = (p: number) => {
    const idx = (n - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
  };
  return { n, mean, std: Math.sqrt(variance), min: sorted[0]!, max: sorted[n - 1]!, p50: q(0.5), p25: q(0.25), p75: q(0.75) };
}

function DashboardPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [minPor, setMinPor] = useState("0");
  const [minPerm, setMinPerm] = useState("0");
  const [faciesFilter, setFaciesFilter] = useState("All");
  const [porCol, setPorCol] = useState("");
  const [permCol, setPermCol] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const numericColumns = useMemo(
    () => headers.filter((h) => rows.some((r) => typeof r[h] === "number")),
    [headers, rows],
  );

  const load = (text: string, name: string) => {
    try {
      const parsed = parseCsv(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setFileName(name);
      setError(null);
      const guessPor =
        parsed.headers.find((h) => /poro/i.test(h)) ??
        parsed.headers.find((h) => typeof parsed.rows[0]?.[h] === "number") ??
        "";
      const guessPerm =
        parsed.headers.find((h) => /perm/i.test(h)) ??
        parsed.headers.filter((h) => typeof parsed.rows[0]?.[h] === "number")[1] ??
        "";
      setPorCol(guessPor);
      setPermCol(guessPerm);
      setMinPor("0");
      setMinPerm("0");
      setFaciesFilter("All");
      toast.success(`Loaded ${parsed.rows.length} rows from ${name}`);
    } catch (e) {
      setError((e as Error).message);
      toast.error((e as Error).message);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setError("Please upload a .csv file.");
      toast.error("Please upload a .csv file.");
      return;
    }
    load(await file.text(), file.name);
  };

  const categoryCol = useMemo(
    () => headers.find((h) => /facies|lithology|type|formation/i.test(h)) ?? "",
    [headers],
  );
  const categories = useMemo(
    () =>
      categoryCol ? Array.from(new Set(rows.map((r) => String(r[categoryCol])))).sort() : [],
    [rows, categoryCol],
  );

  const filtered = useMemo(() => {
    const minP = Number(minPor) || 0;
    const minK = Number(minPerm) || 0;
    return rows.filter((r) => {
      const p = porCol ? Number(r[porCol]) : Infinity;
      const k = permCol ? Number(r[permCol]) : Infinity;
      const catOk = faciesFilter === "All" || !categoryCol || String(r[categoryCol]) === faciesFilter;
      return (!Number.isFinite(p) || p >= minP) && (!Number.isFinite(k) || k >= minK) && catOk;
    });
  }, [rows, minPor, minPerm, porCol, permCol, faciesFilter, categoryCol]);

  const porValues = useMemo(
    () => filtered.map((r) => Number(r[porCol])).filter((v) => Number.isFinite(v)),
    [filtered, porCol],
  );
  const permValues = useMemo(
    () => filtered.map((r) => Number(r[permCol])).filter((v) => Number.isFinite(v)),
    [filtered, permCol],
  );

  const histogram = useMemo(() => {
    if (porValues.length === 0) return [];
    const min = Math.min(...porValues);
    const max = Math.max(...porValues);
    const bins = 12;
    const width = (max - min) / bins || 1;
    const counts = Array.from({ length: bins }, (_, i) => ({
      bin: `${(min + i * width).toFixed(1)}`,
      mid: min + (i + 0.5) * width,
      count: 0,
    }));
    porValues.forEach((v) => {
      const idx = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / width)));
      counts[idx]!.count += 1;
    });
    return counts;
  }, [porValues]);

  const crossplot = useMemo(
    () =>
      filtered
        .map((r) => ({ x: Number(r[porCol]), y: Number(r[permCol]) }))
        .filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y) && d.y > 0),
    [filtered, porCol, permCol],
  );

  const summaryColumns = numericColumns.slice(0, 6);

  const exportFiltered = () => {
    if (filtered.length === 0) {
      toast.error("No rows match the current filters.");
      return;
    }
    const csv = toCsv(headers, filtered.map((r) => headers.map((h) => r[h] ?? "")));
    downloadFile(`filtered_${fileName || "dataset.csv"}`, csv);
    toast.success(`Exported ${filtered.length} filtered rows`);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module C"
        title="Rock & Fluid Data Dashboard"
        description="Upload a core-analysis or fluid-property CSV and explore it: summary statistics per numeric column, cut-off filtering, a porosity histogram, a porosity–permeability crossplot on a log scale, and a download of exactly the rows you filtered."
      />

      <div className="panel p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            <FileUp className="size-4" /> Upload CSV
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => load(sampleDataset(), "demo_core_analysis.csv")}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <Sparkles className="size-4 text-flame" /> Load demo core dataset
          </button>
          <button
            onClick={() => downloadFile("demo_core_analysis_template.csv", sampleDataset())}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Download className="size-4" /> Download CSV template
          </button>
          {fileName ? (
            <span className="text-xs text-muted-foreground">
              Loaded: <span className="font-mono text-foreground">{fileName}</span> ·{" "}
              {rows.length} rows × {headers.length} columns
            </span>
          ) : null}
        </div>
        {error ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        ) : null}
        {rows.length === 0 && !error ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No data yet. Upload your own CSV (first row = column names) or load the demo dataset of
            90 synthetic core plugs to explore every feature.
          </p>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="panel h-fit space-y-5 p-5 lg:sticky lg:top-24">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-primary">
                Filters
              </h2>
              <Field label="Porosity column" hint="Numeric column used for the histogram / x-axis.">
                <select
                  value={porCol}
                  onChange={(e) => setPorCol(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {numericColumns.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Permeability column" hint="Numeric column plotted on the log y-axis.">
                <select
                  value={permCol}
                  onChange={(e) => setPermCol(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {numericColumns.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Minimum ${porCol || "porosity"}`} hint="Show only samples at or above this cut-off.">
                <input
                  type="number"
                  step="any"
                  value={minPor}
                  onChange={(e) => setMinPor(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field label={`Minimum ${permCol || "permeability"}`} hint="Typical net-pay cut-off is 1 mD.">
                <input
                  type="number"
                  step="any"
                  value={minPerm}
                  onChange={(e) => setMinPerm(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              {categories.length > 0 ? (
                <Field label={categoryCol} hint="Restrict to a single rock type / category.">
                  <select
                    value={faciesFilter}
                    onChange={(e) => setFaciesFilter(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="All">All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
              <button
                onClick={exportFiltered}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                <Download className="size-4" /> Download filtered CSV
              </button>
              <p className="text-center text-xs text-muted-foreground">
                {filtered.length} of {rows.length} rows pass the filters
              </p>
            </aside>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Rows after filter" value={String(filtered.length)} hint={`of ${rows.length} total`} />
                <Metric
                  label={`Mean ${porCol}`}
                  value={porValues.length ? fmt(stats(porValues)!.mean, 2) : "—"}
                />
                <Metric
                  label={`Median ${permCol}`}
                  value={permValues.length ? fmt(stats(permValues)!.p50, 3) : "—"}
                />
                <Metric
                  label={`Max ${permCol}`}
                  value={permValues.length ? fmt(stats(permValues)!.max, 2) : "—"}
                />
              </div>

              <div className="panel overflow-x-auto">
                <h2 className="px-5 pt-5 font-display text-lg font-bold">Summary statistics</h2>
                <table className="mt-3 w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-y border-border bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                      {["Column", "Count", "Mean", "Std dev", "Min", "P25", "Median", "P75", "Max"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-right first:text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summaryColumns.map((col) => {
                      const s = stats(
                        filtered.map((r) => Number(r[col])).filter((v) => Number.isFinite(v)),
                      );
                      if (!s) return null;
                      return (
                        <tr key={col} className="border-b border-border/50 last:border-0">
                          <td className="px-4 py-2.5 font-medium">{col}</td>
                          {[s.n, s.mean, s.std, s.min, s.p25, s.p50, s.p75, s.max].map((v, i) => (
                            <td key={i} className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                              {i === 0 ? v : fmt(v, 3)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="panel p-5">
                  <h3 className="font-display text-base font-bold">{porCol} distribution</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    12-bin histogram of the filtered samples
                  </p>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={histogram} margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="bin"
                          stroke="var(--muted-foreground)"
                          tick={{ fontSize: 10 }}
                          label={{
                            value: porCol,
                            position: "insideBottom",
                            offset: -12,
                            fill: "var(--muted-foreground)",
                            fontSize: 12,
                          }}
                        />
                        <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} width={40} />
                        <Tooltip
                          cursor={{ fill: "var(--accent)" }}
                          contentStyle={{
                            background: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(v: number) => [`${v} samples`, "Count"]}
                          labelFormatter={(v) => `Bin start: ${v}`}
                        />
                        <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel p-5">
                  <h3 className="font-display text-base font-bold">
                    {porCol} – {permCol} crossplot
                  </h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Logarithmic permeability axis — the classic reservoir-quality plot
                  </p>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 4 }}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name={porCol}
                          stroke="var(--muted-foreground)"
                          tick={{ fontSize: 11 }}
                          label={{
                            value: porCol,
                            position: "insideBottom",
                            offset: -12,
                            fill: "var(--muted-foreground)",
                            fontSize: 12,
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name={permCol}
                          scale="log"
                          domain={["auto", "auto"]}
                          stroke="var(--muted-foreground)"
                          tick={{ fontSize: 11 }}
                          width={60}
                          tickFormatter={(v: number) => (v >= 1 ? v.toFixed(0) : v.toFixed(2))}
                        />
                        <ZAxis range={[45, 45]} />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          contentStyle={{
                            background: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(v: number, n: string) => [fmt(v, 3), n]}
                        />
                        <Scatter
                          data={crossplot}
                          fill="var(--flame)"
                          fillOpacity={0.75}
                          isAnimationActive={false}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="panel overflow-x-auto">
                <h3 className="px-5 pt-5 font-display text-base font-bold">
                  Filtered data preview (first 25 rows)
                </h3>
                <table className="mt-3 w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-y border-border bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                      {headers.map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 25).map((r, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        {headers.map((h) => (
                          <td key={h} className="whitespace-nowrap px-4 py-2 font-mono text-muted-foreground">
                            {String(r[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-muted-foreground">
                    No rows match the current filters — lower a cut-off to see data.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
