/**
 * units.ts — application-wide unit preferences.
 *
 * Every calculation in Thermaflux runs in strict SI internally. This module only
 * describes how a value is *presented* and how a user-typed number is converted
 * back into SI, so the physics never has to know which unit system is active.
 */

export type SystemId = "si" | "field";

export interface UnitDef {
  /** Stable identifier stored in preferences. */
  id: string;
  /** Short symbol shown next to values. */
  label: string;
  /** Convert a value expressed in this unit into SI base units. */
  toBase: (v: number) => number;
  /** Convert an SI base value into this unit. */
  fromBase: (v: number) => number;
}

export interface QuantityDef {
  id: string;
  label: string;
  /** SI base unit symbol (documentation only). */
  base: string;
  units: UnitDef[];
  si: string;
  field: string;
}

const linear = (id: string, label: string, factor: number): UnitDef => ({
  id,
  label,
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

export const QUANTITIES = {
  length: {
    id: "length",
    label: "Pipe length",
    base: "m",
    si: "m",
    field: "ft",
    units: [
      linear("m", "m", 1),
      linear("km", "km", 1000),
      linear("ft", "ft", 0.3048),
      linear("mi", "mi", 1609.344),
    ],
  },
  diameter: {
    id: "diameter",
    label: "Diameter",
    base: "m",
    si: "mm",
    field: "in",
    units: [linear("mm", "mm", 1e-3), linear("m", "m", 1), linear("in", "in", 0.0254)],
  },
  roughness: {
    id: "roughness",
    label: "Absolute roughness",
    base: "m",
    si: "mm",
    field: "in",
    units: [linear("mm", "mm", 1e-3), linear("in", "in", 0.0254)],
  },
  flow: {
    id: "flow",
    label: "Volumetric flow rate",
    base: "m³/s",
    si: "L/s",
    field: "bbl/d",
    units: [
      linear("lps", "L/s", 1e-3),
      linear("m3h", "m³/h", 1 / 3600),
      linear("m3d", "m³/d", 1 / 86400),
      linear("bbld", "bbl/d", 0.1589872949 / 86400),
      linear("gpm", "gpm", 6.309019640344e-5),
      linear("mmscfd", "MMscf/d", 28316.846592 / 86400),
    ],
  },
  velocity: {
    id: "velocity",
    label: "Velocity",
    base: "m/s",
    si: "m/s",
    field: "ft/s",
    units: [linear("mps", "m/s", 1), linear("ftps", "ft/s", 0.3048)],
  },
  pressure: {
    id: "pressure",
    label: "Pressure / pressure drop",
    base: "Pa",
    si: "kPa",
    field: "psi",
    units: [
      linear("kpa", "kPa", 1000),
      linear("bar", "bar", 1e5),
      linear("psi", "psi", 6894.757293),
      linear("pa", "Pa", 1),
    ],
  },
  gradient: {
    id: "gradient",
    label: "Pressure gradient",
    base: "Pa/m",
    si: "kPa/km",
    field: "psi/ft",
    units: [
      linear("kpakm", "kPa/km", 1),
      linear("psift", "psi/ft", 6894.757293 / 0.3048),
      linear("psi100ft", "psi/100 ft", 6894.757293 / 30.48),
    ],
  },
  head: {
    id: "head",
    label: "Head loss",
    base: "m",
    si: "m",
    field: "ft",
    units: [linear("m", "m", 1), linear("ft", "ft", 0.3048)],
  },
  temperature: {
    id: "temperature",
    label: "Temperature",
    base: "°C",
    si: "°C",
    field: "°F",
    units: [
      { id: "c", label: "°C", toBase: (v) => v, fromBase: (v) => v },
      { id: "f", label: "°F", toBase: (v) => (v - 32) / 1.8, fromBase: (v) => v * 1.8 + 32 },
      { id: "k", label: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  power: {
    id: "power",
    label: "Heat rate / power",
    base: "W",
    si: "kW",
    field: "BTU/hr",
    units: [
      linear("kw", "kW", 1000),
      linear("w", "W", 1),
      linear("btuhr", "BTU/hr", 0.29307107),
      linear("hp", "hp", 745.6998716),
      linear("mmbtuhr", "MMBTU/hr", 293071.07),
    ],
  },
  heatFlux: {
    id: "heatFlux",
    label: "Heat flux",
    base: "W/m²",
    si: "W/m²",
    field: "BTU/hr·ft²",
    units: [
      linear("wm2", "W/m²", 1),
      linear("btuhrft2", "BTU/hr·ft²", 3.154590745),
    ],
  },
  density: {
    id: "density",
    label: "Density",
    base: "kg/m³",
    si: "kg/m³",
    field: "lb/ft³",
    units: [
      linear("kgm3", "kg/m³", 1),
      linear("lbft3", "lb/ft³", 16.01846337),
      linear("ppg", "ppg", 119.8264273),
      { id: "api", label: "°API", toBase: (v) => 141500 / (v + 131.5), fromBase: (v) => 141500 / v - 131.5 },
    ],
  },
  viscosity: {
    id: "viscosity",
    label: "Dynamic viscosity",
    base: "Pa·s",
    si: "Pa·s",
    field: "cP",
    units: [linear("pas", "Pa·s", 1), linear("cp", "cP", 1e-3)],
  },
  area: {
    id: "area",
    label: "Area",
    base: "m²",
    si: "m²",
    field: "ft²",
    units: [linear("m2", "m²", 1), linear("ft2", "ft²", 0.09290304)],
  },
  time: {
    id: "time",
    label: "Time",
    base: "s",
    si: "min",
    field: "min",
    units: [linear("s", "s", 1), linear("min", "min", 60), linear("hr", "hr", 3600)],
  },
} as const;

export type QuantityId = keyof typeof QUANTITIES;

export type UnitPrefs = Record<QuantityId, string>;

const QUANTITY_LIST = Object.values(QUANTITIES) as unknown as QuantityDef[];

/** Preference map for one of the two canned systems. */
export function presetFor(system: SystemId): UnitPrefs {
  const out = {} as UnitPrefs;
  for (const q of QUANTITY_LIST) {
    const wanted = system === "si" ? q.si : q.field;
    const match = q.units.find((u) => u.label === wanted) ?? q.units[0]!;
    out[q.id as QuantityId] = match.id;
  }
  return out;
}

const STORAGE_KEY = "thermaflux-units";
const EVENT = "thermaflux-units-change";

let current: UnitPrefs = presetFor("si");
let hydrated = false;

function read(): UnitPrefs {
  if (typeof window === "undefined") return presetFor("si");
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return presetFor("si");
    const parsed = JSON.parse(raw) as Partial<UnitPrefs>;
    return { ...presetFor("si"), ...parsed };
  } catch {
    return presetFor("si");
  }
}

export function getUnitPrefs(): UnitPrefs {
  if (!hydrated && typeof window !== "undefined") {
    current = read();
    hydrated = true;
  }
  return current;
}

export function setUnitPrefs(next: UnitPrefs) {
  current = next;
  hydrated = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — preferences stay in memory */
    }
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeUnits(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** Which canned system the current preferences match, if any. */
export function activeSystem(prefs: UnitPrefs): SystemId | "custom" {
  const si = presetFor("si");
  const field = presetFor("field");
  const same = (a: UnitPrefs, b: UnitPrefs) =>
    (Object.keys(a) as QuantityId[]).every((k) => a[k] === b[k]);
  if (same(prefs, si)) return "si";
  if (same(prefs, field)) return "field";
  return "custom";
}

export function unitDef(q: QuantityId, prefs: UnitPrefs): UnitDef {
  const def = QUANTITIES[q] as unknown as QuantityDef;
  return def.units.find((u) => u.id === prefs[q]) ?? def.units[0]!;
}

export function quantityList(): QuantityDef[] {
  return QUANTITY_LIST;
}
