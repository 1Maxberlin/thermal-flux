/**
 * advisor.ts — Decision-support engine.
 *
 * The calculators do not just return numbers: these pure functions turn raw
 * results into ranked, actionable engineering advice using recognised industry
 * screening criteria (API RP 14E erosional velocity, lumped-capacitance
 * validity, flow-assurance cool-down windows, reservoir-quality indicators).
 */

export type Severity = "good" | "info" | "warn" | "critical";

export interface Advisory {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  /** Concrete next step for the engineer. */
  action?: string | undefined;
}

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  warn: 1,
  info: 2,
  good: 3,
};

export function sortAdvisories(list: Advisory[]): Advisory[] {
  return [...list].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

/* ------------------------------------------------------------------ */
/* Shared economics assumptions (editable by the user in the UI)       */
/* ------------------------------------------------------------------ */

export interface EconomicsAssumptions {
  /** Electricity / fuel cost, currency per kWh. */
  energyCost: number;
  /** Pump or driver overall efficiency, 0–1. */
  efficiency: number;
  /** Operating hours per year. */
  hoursPerYear: number;
}

export const DEFAULT_ECONOMICS: EconomicsAssumptions = {
  energyCost: 0.12,
  efficiency: 0.65,
  hoursPerYear: 8000,
};

/* ------------------------------------------------------------------ */
/* Hydraulics                                                          */
/* ------------------------------------------------------------------ */

/**
 * API RP 14E erosional velocity limit, m/s.
 * Ve = C / sqrt(rho) in field units; converted to SI with the 1.22 factor.
 */
export function erosionalVelocity(density: number, c = 100): number {
  return (1.22 * c) / Math.sqrt(density);
}

export interface HydraulicEconomics {
  /** Hydraulic power dissipated by friction, W. */
  hydraulicPower: number;
  /** Shaft power required at the given efficiency, W. */
  shaftPower: number;
  /** Annual friction energy, kWh. */
  annualEnergy: number;
  /** Annual cost of the friction loss, currency. */
  annualCost: number;
}

export function hydraulicEconomics(
  flowRate: number,
  pressureDrop: number,
  econ: EconomicsAssumptions = DEFAULT_ECONOMICS,
): HydraulicEconomics {
  const hydraulicPower = Math.max(0, flowRate * pressureDrop);
  const shaftPower = hydraulicPower / Math.max(0.05, econ.efficiency);
  const annualEnergy = (shaftPower / 1000) * econ.hoursPerYear;
  return {
    hydraulicPower,
    shaftPower,
    annualEnergy,
    annualCost: annualEnergy * econ.energyCost,
  };
}

/** Smallest bore (m) that keeps bulk velocity at or below a target. */
export function diameterForVelocity(flowRate: number, targetVelocity: number): number {
  if (targetVelocity <= 0) return NaN;
  return Math.sqrt((4 * flowRate) / (Math.PI * targetVelocity));
}

export interface FlowAdviceInput {
  velocity: number;
  reynolds: number;
  regime: string;
  pressureDrop: number;
  /** Pa per metre. */
  gradient: number;
  density: number;
  diameter: number;
  length: number;
  flowRate: number;
  relativeRoughness: number;
  /** True when the stream carries gas or is multiphase-prone. */
  gasLike: boolean;
}

export function flowAdvisories(i: FlowAdviceInput): Advisory[] {
  const out: Advisory[] = [];
  const ve = erosionalVelocity(i.density);
  const ratio = i.velocity / ve;

  if (ratio >= 1) {
    out.push({
      id: "erosion",
      severity: "critical",
      title: `Erosional velocity exceeded (${(ratio * 100).toFixed(0)} % of API RP 14E limit)`,
      detail: `Bulk velocity is ${i.velocity.toFixed(2)} m/s against an erosional limit of ${ve.toFixed(2)} m/s for this density. Sustained operation risks metal loss at bends, tees and chokes.`,
      action: `Increase the bore to at least ${(diameterForVelocity(i.flowRate, ve * 0.8) * 1000).toFixed(0)} mm, or reduce throughput.`,
    });
  } else if (ratio >= 0.8) {
    out.push({
      id: "erosion",
      severity: "warn",
      title: `Approaching erosional limit (${(ratio * 100).toFixed(0)} %)`,
      detail: `Velocity ${i.velocity.toFixed(2)} m/s vs a ${ve.toFixed(2)} m/s limit. Acceptable for clean, non-corrosive service but not with sand or CO₂/H₂S.`,
      action: "Specify corrosion-resistant bends, or add an inspection point downstream of the first elbow.",
    });
  } else {
    out.push({
      id: "erosion",
      severity: "good",
      title: "Within the erosional velocity limit",
      detail: `Velocity ${i.velocity.toFixed(2)} m/s is ${(ratio * 100).toFixed(0)} % of the ${ve.toFixed(2)} m/s API RP 14E limit.`,
    });
  }

  if (!i.gasLike && i.velocity < 0.9) {
    out.push({
      id: "solids",
      severity: "warn",
      title: "Velocity too low to keep solids and water moving",
      detail: `At ${i.velocity.toFixed(2)} m/s the line is below the ~1 m/s rule of thumb for sand transport and water sweeping, so sand beds, water hold-up and under-deposit corrosion become likely.`,
      action: `Reduce the bore to about ${(diameterForVelocity(i.flowRate, 1.5) * 1000).toFixed(0)} mm, batch-pig the line, or combine streams to raise the rate.`,
    });
  } else if (!i.gasLike && i.velocity >= 0.9 && i.velocity <= 3) {
    out.push({
      id: "solids",
      severity: "good",
      title: "Velocity sits in the preferred 1–3 m/s liquid window",
      detail: "Fast enough to sweep solids and water, slow enough to avoid erosion–corrosion and excessive friction.",
    });
  }

  const psiPer100ft = (i.gradient * 100 * 0.3048) / 6894.757;
  if (psiPer100ft > 2) {
    out.push({
      id: "gradient",
      severity: "warn",
      title: `Steep pressure gradient: ${psiPer100ft.toFixed(2)} psi / 100 ft`,
      detail: "Typical liquid trunk lines are designed below roughly 1–2 psi/100 ft. Above that, pumping cost usually beats the steel saving.",
      action: `Compare the cost of a ${(diameterForVelocity(i.flowRate, Math.min(2, i.velocity * 0.7)) * 1000).toFixed(0)} mm line against the pumping bill below.`,
    });
  }

  if (i.regime === "Transitional") {
    out.push({
      id: "regime",
      severity: "info",
      title: "Flow sits in the transition band (2300 < Re < 4000)",
      detail: "Friction factor is unstable and the prediction carries the widest uncertainty of any regime — treat the pressure drop as ±20 %.",
      action: "Design away from this band by changing rate or bore, or add margin on the pump head.",
    });
  }

  if (i.relativeRoughness > 0.02) {
    out.push({
      id: "roughness",
      severity: "info",
      title: "Very rough bore relative to diameter",
      detail: `ε/D = ${i.relativeRoughness.toFixed(4)} puts the flow in the fully rough regime where friction no longer improves with rate. Scaling or corrosion products may be the cause.`,
      action: "Consider internal coating or a pigging programme; a clean bore can cut ΔP by 20–40 %.",
    });
  }

  if (i.reynolds < 2300 && i.reynolds > 0) {
    out.push({
      id: "laminar",
      severity: "info",
      title: "Laminar flow — viscosity dominates",
      detail: "Pressure drop rises linearly with rate and heat transfer is poor. Typical of heavy or cooled crude.",
      action: "Heating or diluent injection will cut ΔP far more effectively than a bigger pump.",
    });
  }

  return sortAdvisories(out);
}

/* ------------------------------------------------------------------ */
/* Thermal                                                             */
/* ------------------------------------------------------------------ */

/** Biot number Bi = h·Lc/k with Lc = V/A. Lumped capacitance needs Bi < 0.1. */
export function biotNumber(h: number, volume: number, area: number, kSolid: number): number {
  if (kSolid <= 0 || area <= 0) return NaN;
  return (h * (volume / area)) / kSolid;
}

export function conductionAdvisories(input: {
  heatRate: number;
  heatFlux: number;
  k: number;
  thickness: number;
  tHot: number;
  tCold: number;
  econ?: EconomicsAssumptions;
}): Advisory[] {
  const econ = input.econ ?? DEFAULT_ECONOMICS;
  const out: Advisory[] = [];
  const kW = Math.abs(input.heatRate) / 1000;
  const annualCost = kW * econ.hoursPerYear * econ.energyCost;

  out.push({
    id: "cost",
    severity: kW > 5 ? "warn" : "info",
    title: `Heat loss is worth about ${annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} per year`,
    detail: `${kW.toFixed(2)} kW leaking for ${econ.hoursPerYear.toLocaleString()} h/yr at the assumed energy price. This is the number that justifies an insulation upgrade.`,
    action: kW > 5 ? "Price a thicker jacket — payback is usually under two years at this loss rate." : undefined,
  });

  if (Math.abs(input.heatFlux) > 300 && input.k > 1) {
    const needed = (input.k * Math.abs(input.tHot - input.tCold)) / 100;
    out.push({
      id: "insulate",
      severity: "warn",
      title: "Bare-metal heat flux — this surface is effectively uninsulated",
      detail: `${Math.abs(input.heatFlux).toFixed(0)} W/m² is far above the 60–100 W/m² target used for insulated process equipment.`,
      action: `Adding roughly ${(needed * 1000).toFixed(0)} mm of the current material — or 40–60 mm of mineral wool (k ≈ 0.04) — brings the flux under 100 W/m².`,
    });
  }

  if (input.tHot > 60 && input.k > 1) {
    out.push({
      id: "burn",
      severity: "critical",
      title: "Personnel burn hazard on an exposed hot surface",
      detail: `A surface above 60 °C causes burns on brief contact. This wall runs at ${input.tHot.toFixed(0)} °C.`,
      action: "Fit personnel protection insulation or a guard cage on any surface within reach of a walkway.",
    });
  }

  if (input.k < 0.1) {
    out.push({
      id: "material",
      severity: "good",
      title: "Insulating material selected",
      detail: `k = ${input.k} W/m·K is in the insulation band; thickness now controls the loss almost linearly.`,
    });
  }

  return sortAdvisories(out);
}

export function coolingAdvisories(input: {
  tau: number;
  timeToTarget: number | null;
  t0: number;
  tInf: number;
  tTarget: number;
  biot: number;
  /** Wax appearance / hydrate risk temperature, °C. */
  riskTemp: number;
  /** Intervention response time available to the operator, hours. */
  responseHours: number;
  temperatureAt: (t: number) => number;
}): Advisory[] {
  const out: Advisory[] = [];
  const theta0 = input.t0 - input.tInf;
  const thetaRisk = input.riskTemp - input.tInf;
  const noTouchSeconds =
    theta0 > 0 && thetaRisk > 0 && thetaRisk < theta0
      ? -input.tau * Math.log(thetaRisk / theta0)
      : null;

  if (noTouchSeconds !== null) {
    const hours = noTouchSeconds / 3600;
    const severity: Severity =
      hours < input.responseHours ? "critical" : hours < input.responseHours * 2 ? "warn" : "good";
    out.push({
      id: "cooldown",
      severity,
      title: `Cool-down window: ${hours.toFixed(2)} h before ${input.riskTemp} °C is reached`,
      detail:
        severity === "critical"
          ? `Shorter than the ${input.responseHours} h response time you specified — an unplanned shutdown could gel or plug the system before anyone can act.`
          : severity === "warn"
            ? `Only ${(hours / input.responseHours).toFixed(1)}× your ${input.responseHours} h response time. Tight, but workable with a rehearsed procedure.`
            : `Comfortably longer than the ${input.responseHours} h response time. The system tolerates an unplanned shutdown.`,
      action:
        severity === "good"
          ? undefined
          : "Add insulation (lower h), increase thermal mass, or plan a depressurise-and-displace procedure with dead-oil or methanol.",
    });
  } else {
    out.push({
      id: "cooldown",
      severity: "good",
      title: "Risk temperature is never reached by cooling alone",
      detail: `The ambient temperature of ${input.tInf} °C sits above the ${input.riskTemp} °C risk threshold, so the system cannot cool into the danger band.`,
    });
  }

  if (Number.isFinite(input.biot)) {
    out.push({
      id: "biot",
      severity: input.biot > 0.1 ? "warn" : "good",
      title: `Biot number ${input.biot.toFixed(3)} — lumped model ${input.biot > 0.1 ? "is being stretched" : "is valid"}`,
      detail:
        input.biot > 0.1
          ? "Above Bi = 0.1 the body develops a real internal temperature gradient, so this single-temperature model under-predicts the time for the core to cool."
          : "Below Bi = 0.1 internal gradients are negligible and the single-temperature assumption holds to within a few per cent.",
      action: input.biot > 0.1 ? "Treat the answer as the surface response and add margin, or move to a 1-D transient model." : undefined,
    });
  }

  if (input.timeToTarget !== null && input.timeToTarget < 60) {
    out.push({
      id: "fast",
      severity: "info",
      title: "Very rapid cooling",
      detail: "The target is reached in under a minute — thermal shock and differential contraction become the governing concern, not the cooling time itself.",
      action: "Check the material's allowable cooling rate before applying quench conditions in the field.",
    });
  }

  return sortAdvisories(out);
}

/* ------------------------------------------------------------------ */
/* Reservoir quality                                                   */
/* ------------------------------------------------------------------ */

/** Reservoir Quality Index, µm — RQI = 0.0314·sqrt(k/φ). k in mD, φ fraction. */
export function reservoirQualityIndex(permMd: number, porosityFraction: number): number {
  if (permMd <= 0 || porosityFraction <= 0) return NaN;
  return 0.0314 * Math.sqrt(permMd / porosityFraction);
}

/** Flow Zone Indicator, µm. */
export function flowZoneIndicator(permMd: number, porosityFraction: number): number {
  const rqi = reservoirQualityIndex(permMd, porosityFraction);
  const phiZ = porosityFraction / (1 - porosityFraction);
  return rqi / phiZ;
}

/** Winland r35 pore-throat radius, µm. */
export function winlandR35(permMd: number, porosityPct: number): number {
  if (permMd <= 0 || porosityPct <= 0) return NaN;
  return 10 ** (0.732 + 0.588 * Math.log10(permMd) - 0.864 * Math.log10(porosityPct));
}

export function permeabilityClass(k: number): string {
  if (k < 0.1) return "Tight — unconventional";
  if (k < 1) return "Poor";
  if (k < 10) return "Moderate";
  if (k < 100) return "Good";
  if (k < 1000) return "Very good";
  return "Excellent";
}

/** Dykstra–Parsons coefficient of permeability variation from a sorted sample. */
export function dykstraParsons(perms: number[]): number {
  const positive = perms.filter((v) => v > 0).sort((a, b) => b - a);
  if (positive.length < 5) return NaN;
  const at = (p: number) => positive[Math.min(positive.length - 1, Math.floor(p * positive.length))]!;
  const k50 = at(0.5);
  const k841 = at(0.841);
  if (k50 <= 0) return NaN;
  return (k50 - k841) / k50;
}

export function reservoirAdvisories(input: {
  meanPorosityPct: number;
  medianPermMd: number;
  r35: number;
  vdp: number;
  netToGross: number;
  count: number;
}): Advisory[] {
  const out: Advisory[] = [];
  const k = input.medianPermMd;

  out.push({
    id: "quality",
    severity: k < 1 ? "warn" : k < 10 ? "info" : "good",
    title: `Reservoir quality: ${permeabilityClass(k)} (median k = ${k.toFixed(2)} mD)`,
    detail: `With a mean porosity of ${input.meanPorosityPct.toFixed(1)} % and a Winland r35 pore throat of ${Number.isFinite(input.r35) ? input.r35.toFixed(2) : "—"} µm, this rock behaves as a ${
      input.r35 > 10 ? "megaport" : input.r35 > 2 ? "macroport" : input.r35 > 0.5 ? "mesoport" : "microport"
    } system.`,
    action:
      k < 1
        ? "Plan hydraulic stimulation or horizontal drainage — natural completion will not deliver commercial rates."
        : k > 500
          ? "Screen for sand production and consider gravel pack or sand-screen completion."
          : "A conventional cased-and-perforated completion is likely adequate.",
  });

  if (Number.isFinite(input.vdp)) {
    out.push({
      id: "heterogeneity",
      severity: input.vdp > 0.7 ? "warn" : input.vdp > 0.5 ? "info" : "good",
      title: `Dykstra–Parsons coefficient ${input.vdp.toFixed(2)} — ${input.vdp > 0.7 ? "highly" : input.vdp > 0.5 ? "moderately" : "mildly"} heterogeneous`,
      detail:
        input.vdp > 0.7
          ? "Strong permeability layering means injected water or gas will finger through the best streaks and leave the tight layers unswept."
          : "Permeability contrast is manageable; layer-by-layer sweep should be reasonably uniform.",
      action: input.vdp > 0.7 ? "Model layered sweep, and budget for conformance control (polymer or gel) in any injection scheme." : undefined,
    });
  }

  out.push({
    id: "ntg",
    severity: input.netToGross < 0.4 ? "warn" : "good",
    title: `Net-to-gross from your cut-offs: ${(input.netToGross * 100).toFixed(0)} %`,
    detail: `${Math.round(input.netToGross * input.count)} of ${input.count} samples pass the porosity and permeability cut-offs currently applied.`,
    action:
      input.netToGross < 0.4
        ? "Test the sensitivity of volumes to the cut-off — a low N:G is often as much a cut-off choice as a rock property."
        : undefined,
  });

  if (input.count < 20) {
    out.push({
      id: "sample",
      severity: "info",
      title: "Small sample count",
      detail: `${input.count} samples is thin for statistically meaningful cut-off work; percentiles will move noticeably with each added plug.`,
      action: "Treat percentiles as indicative until at least 30–50 plugs are available.",
    });
  }

  return sortAdvisories(out);
}
