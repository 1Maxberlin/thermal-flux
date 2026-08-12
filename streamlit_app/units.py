"""units.py — unit-system handling shared by every Streamlit page.

All physics in :mod:`engineering` runs in SI. This module only converts values
for *display* and converts user input back into SI, exactly like the web build.

Two canned systems are provided:

* ``"SI"``    — mm, m, L/s, kPa, degC, kW
* ``"Field"`` — in, ft, bbl/d, psi, degF, BTU/hr
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List

import streamlit as st


@dataclass(frozen=True)
class Unit:
    """A display unit and its conversion to/from the SI base unit."""

    label: str
    to_base: Callable[[float], float]
    from_base: Callable[[float], float]


def _linear(label: str, factor: float) -> Unit:
    """Build a unit whose conversion to SI is a simple multiplication."""
    return Unit(label, lambda v, f=factor: v * f, lambda v, f=factor: v / f)


#: quantity -> {unit label: Unit}
QUANTITIES: Dict[str, Dict[str, Unit]] = {
    "diameter": {u.label: u for u in [_linear("mm", 1e-3), _linear("in", 0.0254), _linear("m", 1.0)]},
    "length": {u.label: u for u in [_linear("m", 1.0), _linear("ft", 0.3048), _linear("km", 1000.0)]},
    "roughness": {u.label: u for u in [_linear("mm", 1e-3), _linear("in", 0.0254)]},
    "flow": {
        u.label: u
        for u in [
            _linear("L/s", 1e-3),
            _linear("m3/h", 1 / 3600),
            _linear("bbl/d", 0.1589872949 / 86400),
            _linear("gpm", 6.309019640344e-5),
        ]
    },
    "velocity": {u.label: u for u in [_linear("m/s", 1.0), _linear("ft/s", 0.3048)]},
    "pressure": {
        u.label: u for u in [_linear("kPa", 1000.0), _linear("psi", 6894.757293), _linear("bar", 1e5)]
    },
    "head": {u.label: u for u in [_linear("m", 1.0), _linear("ft", 0.3048)]},
    "power": {
        u.label: u
        for u in [_linear("kW", 1000.0), _linear("BTU/hr", 0.29307107), _linear("hp", 745.6998716)]
    },
    "heat_flux": {u.label: u for u in [_linear("W/m2", 1.0), _linear("BTU/hr.ft2", 3.154590745)]},
    "temperature": {
        "degC": Unit("degC", lambda v: v, lambda v: v),
        "degF": Unit("degF", lambda v: (v - 32) / 1.8, lambda v: v * 1.8 + 32),
        "K": Unit("K", lambda v: v - 273.15, lambda v: v + 273.15),
    },
    "time": {u.label: u for u in [_linear("min", 60.0), _linear("s", 1.0), _linear("hr", 3600.0)]},
}

SI_DEFAULTS = {
    "diameter": "mm",
    "length": "m",
    "roughness": "mm",
    "flow": "L/s",
    "velocity": "m/s",
    "pressure": "kPa",
    "head": "m",
    "power": "kW",
    "heat_flux": "W/m2",
    "temperature": "degC",
    "time": "min",
}

FIELD_DEFAULTS = {
    "diameter": "in",
    "length": "ft",
    "roughness": "in",
    "flow": "bbl/d",
    "velocity": "ft/s",
    "pressure": "psi",
    "head": "ft",
    "power": "BTU/hr",
    "heat_flux": "BTU/hr.ft2",
    "temperature": "degF",
    "time": "min",
}


def preferences() -> Dict[str, str]:
    """Current unit preferences, seeded with SI defaults on first run."""
    if "units" not in st.session_state:
        st.session_state["units"] = dict(SI_DEFAULTS)
    return st.session_state["units"]


def apply_system(system: str) -> None:
    """Switch every quantity to the ``"SI"`` or ``"Field"`` preset."""
    st.session_state["units"] = dict(SI_DEFAULTS if system == "SI" else FIELD_DEFAULTS)


def unit(quantity: str) -> Unit:
    """The active :class:`Unit` for a quantity."""
    prefs = preferences()
    table = QUANTITIES[quantity]
    return table.get(prefs.get(quantity, ""), next(iter(table.values())))


def label(quantity: str) -> str:
    """Symbol of the active unit, e.g. ``"psi"``."""
    return unit(quantity).label


def to_display(quantity: str, si_value: float) -> float:
    """Convert an SI value into the user's display unit."""
    return unit(quantity).from_base(si_value)


def to_si(quantity: str, value: float) -> float:
    """Convert a value typed in the display unit back into SI."""
    return unit(quantity).to_base(value)


def options(quantity: str) -> List[str]:
    """Every unit label available for a quantity."""
    return list(QUANTITIES[quantity])


def sidebar_unit_switch() -> None:
    """Render the compact SI/Field switch used on every calculation page."""
    with st.sidebar:
        current = "Field" if preferences() == FIELD_DEFAULTS else "SI"
        chosen = st.radio(
            "Unit system",
            ["SI", "Field"],
            index=0 if current == "SI" else 1,
            horizontal=True,
            help="Field units are the customary oilfield set: in, ft, bbl/d, psi, degF.",
        )
        if chosen != current:
            apply_system(chosen)
            st.rerun()
