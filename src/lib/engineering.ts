/**
 * engineering.ts — Core engineering object model and correlations.
 *
 * Mirrors the Python module `streamlit_app/engineering.py` used for the
 * Streamlit Community Cloud deployment. Every public class and function is
 * documented, unit-annotated and defensively validated so that bad user input
 * produces a clear error instead of a crash or a silent NaN.
 */

/** Acceleration due to gravity, m/s^2. */
export const G = 9.80665;

export interface FluidProps {
  /** Display name of the fluid. */
  name: string;
  /** Density, kg/m^3. */
  density: number;
  /** Dynamic viscosity, Pa*s. */
  viscosity: number;
  /** Specific heat capacity, J/(kg*K). */
  cp: number;
  /** Thermal conductivity, W/(m*K). */
  k: number;
}

/**
 * A working fluid with the physical properties needed for flow and thermal
 * calculations.
 */
export class Fluid implements FluidProps {
  name: string;
  density: number;
  viscosity: number;
  cp: number;
  k: number;

  constructor(props: FluidProps) {
    if (props.density <= 0) throw new Error("Fluid density must be greater than zero.");
    if (props.viscosity <= 0) throw new Error("Fluid viscosity must be greater than zero.");
    this.name = props.name;
    this.density = props.density;
    this.viscosity = props.viscosity;
    this.cp = props.cp;
    this.k = props.k;
  }

  /** Kinematic viscosity nu = mu / rho, m^2/s. */
  get kinematicViscosity(): number {
    return this.viscosity / this.density;
  }
}

/** Built-in fluid library (properties at ~20 degC, 1 atm). */
export const FLUID_LIBRARY: Record<string, FluidProps> = {
  water: { name: "Water", density: 998.2, viscosity: 1.002e-3, cp: 4182, k: 0.598 },
  air: { name: "Air", density: 1.204, viscosity: 1.825e-5, cp: 1005, k: 0.0257 },
  crude_oil: { name: "Crude Oil (light)", density: 860, viscosity: 8.0e-3, cp: 2000, k: 0.14 },
  brine: { name: "Brine (10% NaCl)", density: 1071, viscosity: 1.4e-3, cp: 3600, k: 0.58 },
  natural_gas: { name: "Natural Gas (methane)", density: 0.717, viscosity: 1.1e-5, cp: 2220, k: 0.033 },
};

export interface PipeFlowResult {
  /** Cross-sectional area, m^2. */
  area: number;
  /** Mean velocity, m/s. */
  velocity: number;
  /** Reynolds number, dimensionless. */
  reynolds: number;
  /** Darcy friction factor, dimensionless. */
  frictionFactor: number;
  /** Pressure drop, Pa. */
  pressureDrop: number;
  /** Head loss, m of fluid. */
  headLoss: number;
  /** Flow regime label. */
  regime: "Laminar" | "Transitional" | "Turbulent";
  /** Relative roughness eps/D, dimensionless. */
  relativeRoughness: number;
}

/**
 * A circular pipe segment carrying a single-phase fluid.
 *
 * Diameter and length are in metres; absolute roughness in metres.
 */
export class Pipe {
  diameter: number;
  length: number;
  roughness: number;

  constructor(diameter: number, length: number, roughness: number) {
    if (!Number.isFinite(diameter) || diameter <= 0)
      throw new Error("Pipe internal diameter must be a positive number (m).");
    if (!Number.isFinite(length) || length <= 0)
      throw new Error("Pipe length must be a positive number (m).");
    if (!Number.isFinite(roughness) || roughness < 0)
      throw new Error("Absolute roughness cannot be negative (m).");
    this.diameter = diameter;
    this.length = length;
    this.roughness = roughness;
  }

  /** Internal cross-sectional area A = pi*D^2/4, m^2. */
  get area(): number {
    return (Math.PI * this.diameter ** 2) / 4;
  }

  /** Relative roughness eps/D, dimensionless. */
  get relativeRoughness(): number {
    return this.roughness / this.diameter;
  }

  /** Mean velocity from volumetric flow rate Q (m^3/s), returns m/s. */
  velocity(flowRate: number): number {
    return flowRate / this.area;
  }

  /** Reynolds number Re = rho*v*D/mu for a given fluid and flow rate. */
  reynolds(fluid: Fluid, flowRate: number): number {
    return (fluid.density * this.velocity(flowRate) * this.diameter) / fluid.viscosity;
  }

  /**
   * Darcy friction factor.
   *
   * Laminar (Re < 2300): f = 64/Re (exact analytical solution).
   * Turbulent (Re > 4000): Colebrook–White solved by fixed-point iteration,
   * seeded with the Swamee–Jain explicit approximation.
   * Transitional (2300–4000): linear blend of the two bounding values.
   */
  frictionFactor(re: number): number {
    if (re <= 0) return 0;
    if (re < 2300) return 64 / re;

    const colebrook = (reynolds: number): number => {
      const rr = this.relativeRoughness;
      // Swamee–Jain seed
      let f =
        0.25 / Math.log10(rr / 3.7 + 5.74 / Math.pow(reynolds, 0.9)) ** 2;
      for (let i = 0; i < 60; i++) {
        const rhs = -2 * Math.log10(rr / 3.7 + 2.51 / (reynolds * Math.sqrt(f)));
        const next = 1 / rhs ** 2;
        if (Math.abs(next - f) < 1e-12) return next;
        f = next;
      }
      return f;
    };

    if (re > 4000) return colebrook(re);
    const fLam = 64 / 2300;
    const fTurb = colebrook(4000);
    const x = (re - 2300) / (4000 - 2300);
    return fLam + x * (fTurb - fLam);
  }

  /**
   * Full single-phase analysis at volumetric flow rate Q (m^3/s).
   * Pressure drop uses the Darcy–Weisbach equation:
   *   dP = f * (L/D) * (rho * v^2 / 2)
   */
  analyse(fluid: Fluid, flowRate: number): PipeFlowResult {
    if (!Number.isFinite(flowRate) || flowRate < 0)
      throw new Error("Flow rate must be zero or a positive number (m^3/s).");
    const velocity = this.velocity(flowRate);
    const reynolds = this.reynolds(fluid, flowRate);
    const frictionFactor = this.frictionFactor(reynolds);
    const pressureDrop =
      frictionFactor * (this.length / this.diameter) * ((fluid.density * velocity ** 2) / 2);
    const regime = reynolds < 2300 ? "Laminar" : reynolds > 4000 ? "Turbulent" : "Transitional";
    return {
      area: this.area,
      velocity,
      reynolds,
      frictionFactor,
      pressureDrop,
      headLoss: pressureDrop / (fluid.density * G),
      regime,
      relativeRoughness: this.relativeRoughness,
    };
  }
}

/**
 * Steady-state 1-D conduction through a single flat wall (Fourier's law).
 *
 * q = k * A * (T_hot - T_cold) / L  [W]
 */
export function conductionThroughWall(
  k: number,
  area: number,
  thickness: number,
  tHot: number,
  tCold: number,
) {
  if (k <= 0) throw new Error("Thermal conductivity must be positive (W/m·K).");
  if (area <= 0) throw new Error("Wall area must be positive (m²).");
  if (thickness <= 0) throw new Error("Wall thickness must be positive (m).");
  const deltaT = tHot - tCold;
  const heatRate = (k * area * deltaT) / thickness;
  return {
    /** Heat transfer rate, W. */
    heatRate,
    /** Heat flux, W/m^2. */
    heatFlux: heatRate / area,
    /** Conductive thermal resistance, K/W. */
    resistance: thickness / (k * area),
    /** Temperature difference across the wall, K. */
    deltaT,
  };
}

/**
 * Newton's law of cooling (lumped capacitance).
 *
 * T(t) = T_inf + (T0 - T_inf) * exp(-t / tau),  tau = rho*V*cp / (h*A)
 * Time to reach T_target: t = -tau * ln((T_target - T_inf)/(T0 - T_inf))
 */
export function newtonCooling(params: {
  /** Initial body temperature, degC. */
  t0: number;
  /** Ambient temperature, degC. */
  tInf: number;
  /** Target temperature, degC. */
  tTarget: number;
  /** Convective heat transfer coefficient, W/(m^2*K). */
  h: number;
  /** Surface area exposed to the ambient, m^2. */
  area: number;
  /** Body volume, m^3. */
  volume: number;
  /** Density, kg/m^3. */
  density: number;
  /** Specific heat, J/(kg*K). */
  cp: number;
}) {
  const { t0, tInf, tTarget, h, area, volume, density, cp } = params;
  if (h <= 0) throw new Error("Heat transfer coefficient must be positive (W/m²·K).");
  if (area <= 0 || volume <= 0) throw new Error("Area and volume must be positive.");
  if (density <= 0 || cp <= 0) throw new Error("Density and specific heat must be positive.");

  const tau = (density * volume * cp) / (h * area);
  const theta0 = t0 - tInf;
  const thetaTarget = tTarget - tInf;

  let timeToTarget: number | null = null;
  let note = "";
  if (theta0 === 0) {
    note = "Body already at ambient temperature — no driving force for cooling.";
  } else if (thetaTarget / theta0 <= 0) {
    note = "Target temperature is beyond the ambient temperature — unreachable by cooling alone.";
  } else if (Math.abs(thetaTarget) >= Math.abs(theta0)) {
    note = "Target is not between the initial and ambient temperatures.";
  } else {
    timeToTarget = -tau * Math.log(thetaTarget / theta0);
  }

  /** Temperature at time t (seconds), degC. */
  const temperatureAt = (t: number) => tInf + theta0 * Math.exp(-t / tau);

  return { tau, timeToTarget, temperatureAt, note, biotReady: true };
}

/** Format a number with sensible engineering precision. */
export function fmt(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) return value.toExponential(digits);
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

/** Build a CSV string from a header row and data rows. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

/** Trigger a client-side download of a text file. */
export function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
