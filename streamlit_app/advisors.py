"""advisors.py — decision-support rules layered on top of the raw physics.

Each function returns a list of ``Advisory`` records ranked by severity so a
Streamlit page can present ranked engineering guidance rather than bare numbers.
Screening criteria follow common industry practice (API RP 14E erosional
velocity, Winland r35 pore-throat sizing, Biot-number validity for lumped
capacitance).
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Optional

SEVERITY_ORDER = {"critical": 0, "review": 1, "acceptable": 2}


@dataclass
class Advisory:
    """One piece of ranked guidance."""

    severity: str  # "critical" | "review" | "acceptable"
    title: str
    detail: str
    action: Optional[str] = None


def _sorted(items: List[Advisory]) -> List[Advisory]:
    return sorted(items, key=lambda a: SEVERITY_ORDER.get(a.severity, 3))


def erosional_velocity(density: float, c_factor: float = 100.0) -> float:
    """API RP 14E erosional velocity limit in m/s.

    Args:
        density: Mixture density, kg/m^3.
        c_factor: Empirical C-factor (100 for continuous service, carbon steel).
    """
    if density <= 0:
        raise ValueError("Density must be positive to evaluate the erosional limit.")
    density_lb_ft3 = density / 16.01846337
    v_fps = c_factor / math.sqrt(density_lb_ft3)
    return v_fps * 0.3048


def hydraulic_economics(
    flow_rate: float,
    pressure_drop: float,
    energy_price: float = 0.12,
    efficiency: float = 0.65,
    hours_per_year: float = 8000.0,
) -> dict:
    """Cost of overcoming pipe friction for a year of operation.

    Returns hydraulic power (W), shaft power (W), annual energy (kWh) and cost.
    """
    if efficiency <= 0:
        raise ValueError("Pump efficiency must be greater than zero.")
    hydraulic = max(0.0, flow_rate) * max(0.0, pressure_drop)
    shaft = hydraulic / efficiency
    energy = shaft / 1000 * hours_per_year
    return {
        "hydraulic_power": hydraulic,
        "shaft_power": shaft,
        "annual_energy": energy,
        "annual_cost": energy * energy_price,
    }


def diameter_for_velocity(flow_rate: float, target_velocity: float = 2.0) -> float:
    """Bore, in metres, that delivers a target design velocity for a given rate."""
    if target_velocity <= 0:
        raise ValueError("Target velocity must be positive.")
    return math.sqrt(4 * max(0.0, flow_rate) / (math.pi * target_velocity))


def flow_advisories(result: dict, density: float, length: float, gas_like: bool = False) -> List[Advisory]:
    """Screen a pipe-flow duty point against normal design practice."""
    out: List[Advisory] = []
    v = result["velocity"]
    v_e = erosional_velocity(density)
    gradient_psi_100ft = result["pressure_drop"] / max(length, 1e-9) * 30.48 / 6894.757293

    if v > v_e:
        out.append(
            Advisory(
                "critical",
                f"Above the API RP 14E erosional limit ({v_e:.2f} m/s)",
                f"Velocity of {v:.2f} m/s risks erosion-corrosion of the pipe wall and fittings.",
                "Increase the bore, split the flow, or specify a corrosion-resistant alloy.",
            )
        )
    else:
        out.append(
            Advisory(
                "acceptable",
                "Within the erosional velocity limit",
                f"Velocity {v:.2f} m/s is {100 * v / v_e:.0f} % of the {v_e:.2f} m/s API RP 14E limit.",
            )
        )

    if not gas_like:
        if v < 0.9:
            out.append(
                Advisory(
                    "review",
                    "Velocity below the solids-transport window",
                    f"{v:.2f} m/s may allow sand, water or wax to settle out along the line.",
                    "Consider a smaller bore or periodic pigging.",
                )
            )
        elif v <= 3.0:
            out.append(
                Advisory(
                    "acceptable",
                    "Velocity sits in the preferred 1-3 m/s liquid window",
                    "Fast enough to sweep solids and water, slow enough to avoid excessive friction.",
                )
            )

    if gradient_psi_100ft > 2.0:
        out.append(
            Advisory(
                "review",
                f"Steep pressure gradient: {gradient_psi_100ft:.2f} psi / 100 ft",
                "Trunk lines are usually designed below roughly 1-2 psi/100 ft; above that the "
                "pumping bill normally beats the steel saving.",
                "Price a larger line against the annual pumping cost.",
            )
        )

    if result["reynolds"] < 2300:
        out.append(
            Advisory(
                "review",
                "Laminar flow",
                "Heat transfer and mixing are poor and the fluid is likely viscous or cold.",
                "Check whether heating or dilution improves deliverability.",
            )
        )

    return _sorted(out)


def cooling_advisories(
    tau: float,
    time_to_target: Optional[float],
    risk_temperature: float,
    t0: float,
    t_inf: float,
    response_seconds: float,
    biot: Optional[float] = None,
) -> List[Advisory]:
    """Screen a shut-in cool-down against flow-assurance response time."""
    out: List[Advisory] = []

    if time_to_target is None:
        out.append(
            Advisory(
                "review",
                "Target temperature is never reached",
                "The target must lie between the starting and ambient temperature.",
            )
        )
    elif time_to_target < response_seconds:
        out.append(
            Advisory(
                "critical",
                "Cool-down beats the crew response time",
                f"The system reaches the target in {time_to_target / 3600:.2f} h but the crew needs "
                f"{response_seconds / 3600:.2f} h.",
                "Add insulation, increase thermal mass, or plan a chemical inhibition strategy.",
            )
        )
    else:
        out.append(
            Advisory(
                "acceptable",
                "No-touch window is longer than the response time",
                f"Time to target {time_to_target / 3600:.2f} h versus {response_seconds / 3600:.2f} h available.",
            )
        )

    if t_inf < risk_temperature < t0:
        out.append(
            Advisory(
                "review",
                f"Fluid will pass the flow-assurance risk temperature ({risk_temperature:.0f} degC)",
                "Wax or hydrate formation becomes possible once the line cools below this point.",
                "Insulate, bullhead inhibitor, or displace the line on shutdown.",
            )
        )

    if biot is not None and biot > 0.1:
        out.append(
            Advisory(
                "review",
                f"Lumped-capacitance assumption is marginal (Bi = {biot:.2f})",
                "Internal temperature gradients matter above Bi = 0.1, so the single-temperature "
                "model under-predicts surface cooling.",
                "Treat the answer as indicative and confirm with a transient conduction model.",
            )
        )

    out.append(
        Advisory(
            "acceptable",
            f"Thermal time constant tau = {tau / 60:.1f} min",
            "63 % of the total temperature change happens within one time constant; 5 tau is "
            "practically complete.",
        )
    )
    return _sorted(out)


def rock_advisories(mean_porosity: float, mean_perm: float, dykstra_parsons: Optional[float]) -> List[Advisory]:
    """Classify a filtered core dataset and flag completion implications."""
    out: List[Advisory] = []
    r35 = winland_r35(mean_perm, mean_porosity)

    if mean_perm < 1:
        out.append(
            Advisory(
                "critical",
                "Tight rock: mean permeability below 1 mD",
                "Natural deliverability will be poor.",
                "Plan hydraulic stimulation or horizontal drainage.",
            )
        )
    elif mean_perm < 50:
        out.append(
            Advisory("review", "Moderate permeability", f"Mean k = {mean_perm:.1f} mD; expect a modest rate per metre of pay.")
        )
    else:
        out.append(
            Advisory("acceptable", "Good permeability", f"Mean k = {mean_perm:.1f} mD supports conventional completions.")
        )

    out.append(
        Advisory(
            "acceptable" if r35 > 2 else "review",
            f"Winland r35 = {r35:.2f} microns",
            "Pore throats above 2 microns are megaport/macroport rock; below 0.5 microns the rock "
            "behaves as a tight seal.",
        )
    )

    if dykstra_parsons is not None and dykstra_parsons > 0.7:
        out.append(
            Advisory(
                "review",
                f"Highly heterogeneous interval (V_DP = {dykstra_parsons:.2f})",
                "Injected fluid will finger through the best layers and bypass the rest.",
                "Consider conformance control or selective completion.",
            )
        )
    return _sorted(out)


def winland_r35(permeability_md: float, porosity_pct: float) -> float:
    """Winland r35 pore-throat radius (microns) from permeability and porosity."""
    k = max(permeability_md, 1e-6)
    phi = max(porosity_pct, 1e-6)
    log_r35 = 0.732 + 0.588 * math.log10(k) - 0.864 * math.log10(phi)
    return 10 ** log_r35


def dykstra_parsons(perm_values) -> Optional[float]:
    """Dykstra-Parsons coefficient of permeability variation (0 = uniform)."""
    values = sorted(v for v in perm_values if v and v > 0)
    if len(values) < 5:
        return None
    import statistics

    logs = [math.log10(v) for v in values]
    mean = statistics.mean(logs)
    sd = statistics.pstdev(logs)
    k50 = 10 ** mean
    k84 = 10 ** (mean - sd)
    if k50 <= 0:
        return None
    return (k50 - k84) / k50
