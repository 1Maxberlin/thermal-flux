"""engineering.py — Core engineering object model for the FlowThermal Suite.

Contains the reusable physics used by every Streamlit page:

* :class:`Fluid`  — fluid physical properties
* :class:`Pipe`   — circular pipe hydraulics (Darcy–Weisbach + Colebrook–White)
* :func:`conduction_through_wall` — Fourier's law, single flat layer
* :func:`newton_cooling`          — lumped-capacitance Newton cooling

All quantities are SI unless stated otherwise. Every public callable validates
its inputs and raises ``ValueError`` with a readable message so the UI can show
an explanation instead of crashing.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, Optional

G = 9.80665  # gravitational acceleration, m/s^2


@dataclass
class Fluid:
    """A working fluid.

    Args:
        name: Display name.
        density: Density rho, kg/m^3.
        viscosity: Dynamic viscosity mu, Pa.s.
        cp: Specific heat capacity, J/(kg.K).
        k: Thermal conductivity, W/(m.K).
    """

    name: str
    density: float
    viscosity: float
    cp: float = 0.0
    k: float = 0.0

    def __post_init__(self) -> None:
        if self.density <= 0:
            raise ValueError("Fluid density must be greater than zero.")
        if self.viscosity <= 0:
            raise ValueError("Fluid viscosity must be greater than zero.")

    @property
    def kinematic_viscosity(self) -> float:
        """Kinematic viscosity nu = mu / rho, m^2/s."""
        return self.viscosity / self.density


FLUID_LIBRARY: Dict[str, Fluid] = {
    "Water": Fluid("Water", 998.2, 1.002e-3, 4182, 0.598),
    "Air": Fluid("Air", 1.204, 1.825e-5, 1005, 0.0257),
    "Crude Oil (light)": Fluid("Crude Oil (light)", 860.0, 8.0e-3, 2000, 0.14),
    "Brine (10% NaCl)": Fluid("Brine (10% NaCl)", 1071.0, 1.4e-3, 3600, 0.58),
    "Natural Gas (methane)": Fluid("Natural Gas (methane)", 0.717, 1.1e-5, 2220, 0.033),
}


class Pipe:
    """A straight circular pipe segment carrying single-phase flow.

    Args:
        diameter: Internal diameter D, m.
        length: Developed length L, m.
        roughness: Absolute wall roughness epsilon, m.
    """

    def __init__(self, diameter: float, length: float, roughness: float) -> None:
        if diameter <= 0:
            raise ValueError("Pipe internal diameter must be a positive number (m).")
        if length <= 0:
            raise ValueError("Pipe length must be a positive number (m).")
        if roughness < 0:
            raise ValueError("Absolute roughness cannot be negative (m).")
        self.diameter = diameter
        self.length = length
        self.roughness = roughness

    @property
    def area(self) -> float:
        """Cross-sectional area A = pi*D^2/4, m^2."""
        return math.pi * self.diameter**2 / 4

    @property
    def relative_roughness(self) -> float:
        """Relative roughness epsilon/D, dimensionless."""
        return self.roughness / self.diameter

    def velocity(self, flow_rate: float) -> float:
        """Mean velocity v = Q/A, m/s, for Q in m^3/s."""
        return flow_rate / self.area

    def reynolds(self, fluid: Fluid, flow_rate: float) -> float:
        """Reynolds number Re = rho*v*D/mu, dimensionless."""
        return fluid.density * self.velocity(flow_rate) * self.diameter / fluid.viscosity

    def _colebrook(self, re: float) -> float:
        """Darcy friction factor from Colebrook-White, seeded with Swamee-Jain."""
        rr = self.relative_roughness
        f = 0.25 / math.log10(rr / 3.7 + 5.74 / re**0.9) ** 2
        for _ in range(60):
            rhs = -2 * math.log10(rr / 3.7 + 2.51 / (re * math.sqrt(f)))
            new_f = 1 / rhs**2
            if abs(new_f - f) < 1e-12:
                return new_f
            f = new_f
        return f

    def friction_factor(self, re: float) -> float:
        """Darcy friction factor.

        Laminar (Re < 2300) uses the exact f = 64/Re. Turbulent (Re > 4000)
        uses Colebrook-White. The transitional band is linearly blended.
        """
        if re <= 0:
            return 0.0
        if re < 2300:
            return 64 / re
        if re > 4000:
            return self._colebrook(re)
        f_lam = 64 / 2300
        f_turb = self._colebrook(4000)
        x = (re - 2300) / (4000 - 2300)
        return f_lam + x * (f_turb - f_lam)

    def analyse(self, fluid: Fluid, flow_rate: float) -> dict:
        """Full single-phase analysis at volumetric flow rate Q (m^3/s).

        Returns a dict with velocity (m/s), reynolds (-), friction_factor (-),
        pressure_drop (Pa), head_loss (m) and the flow regime label.
        """
        if flow_rate < 0:
            raise ValueError("Flow rate must be zero or a positive number (m^3/s).")
        v = self.velocity(flow_rate)
        re = self.reynolds(fluid, flow_rate)
        f = self.friction_factor(re)
        dp = f * (self.length / self.diameter) * (fluid.density * v**2 / 2)
        regime = "Laminar" if re < 2300 else ("Turbulent" if re > 4000 else "Transitional")
        return {
            "area": self.area,
            "velocity": v,
            "reynolds": re,
            "friction_factor": f,
            "pressure_drop": dp,
            "head_loss": dp / (fluid.density * G),
            "regime": regime,
            "relative_roughness": self.relative_roughness,
        }


def conduction_through_wall(
    k: float, area: float, thickness: float, t_hot: float, t_cold: float
) -> dict:
    """Steady 1-D conduction through a single flat wall (Fourier's law).

    q = k * A * (T_hot - T_cold) / L

    Args:
        k: Thermal conductivity, W/(m.K).
        area: Wall area normal to heat flow, m^2.
        thickness: Wall thickness L, m.
        t_hot: Hot surface temperature, degC.
        t_cold: Cold surface temperature, degC.

    Returns:
        dict with heat_rate (W), heat_flux (W/m^2), resistance (K/W), delta_t (K).
    """
    if k <= 0:
        raise ValueError("Thermal conductivity must be positive (W/m.K).")
    if area <= 0:
        raise ValueError("Wall area must be positive (m^2).")
    if thickness <= 0:
        raise ValueError("Wall thickness must be positive (m).")
    delta_t = t_hot - t_cold
    q = k * area * delta_t / thickness
    return {
        "heat_rate": q,
        "heat_flux": q / area,
        "resistance": thickness / (k * area),
        "delta_t": delta_t,
    }


def newton_cooling(
    t0: float,
    t_inf: float,
    t_target: float,
    h: float,
    area: float,
    volume: float,
    density: float,
    cp: float,
) -> dict:
    """Lumped-capacitance cooling (Newton's law of cooling).

    T(t) = T_inf + (T0 - T_inf) * exp(-t/tau) with tau = rho*V*cp/(h*A).

    Args:
        t0: Initial temperature, degC.
        t_inf: Ambient temperature, degC.
        t_target: Target temperature, degC.
        h: Convective coefficient, W/(m^2.K).
        area: Exposed surface area, m^2.
        volume: Body volume, m^3.
        density: Body density, kg/m^3.
        cp: Body specific heat, J/(kg.K).

    Returns:
        dict with tau (s), time_to_target (s or None) and an explanatory note.
    """
    if h <= 0:
        raise ValueError("Heat transfer coefficient must be positive (W/m^2.K).")
    if area <= 0 or volume <= 0:
        raise ValueError("Area and volume must be positive.")
    if density <= 0 or cp <= 0:
        raise ValueError("Density and specific heat must be positive.")

    tau = density * volume * cp / (h * area)
    theta0 = t0 - t_inf
    theta_t = t_target - t_inf

    time_to_target: Optional[float] = None
    note = ""
    if theta0 == 0:
        note = "Body already at ambient temperature - no driving force for cooling."
    elif theta_t / theta0 <= 0 or abs(theta_t) >= abs(theta0):
        note = "Target temperature is not between the initial and ambient temperatures."
    else:
        time_to_target = -tau * math.log(theta_t / theta0)

    return {"tau": tau, "time_to_target": time_to_target, "note": note, "theta0": theta0}


def temperature_at(t: float, t0: float, t_inf: float, tau: float) -> float:
    """Temperature (degC) at time t (s) for the lumped-capacitance solution."""
    return t_inf + (t0 - t_inf) * math.exp(-t / tau)
