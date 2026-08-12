"""Module B — Heat Transfer Calculator (Streamlit page)."""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import streamlit as st

sys.path.append(str(Path(__file__).resolve().parents[1]))
from engineering import conduction_through_wall, newton_cooling, temperature_at  # noqa: E402
import units as U  # noqa: E402
from advisors import cooling_advisories  # noqa: E402

st.set_page_config(page_title="Heat Transfer Calculator", page_icon="🔥", layout="wide")
st.title("Heat Transfer Calculator")
U.sidebar_unit_switch()

st.header("1 · Steady-state conduction through a flat wall")
st.latex(r"q = \frac{k\,A\,(T_{hot}-T_{cold})}{L}")

col_in, col_out = st.columns(2)
with col_in:
    k = st.number_input(
        "Thermal conductivity k (W/m·K)", value=45.0, min_value=0.001,
        help="How readily the wall conducts heat. Metals 10–400; insulation 0.02–0.06.",
    )
    area = st.number_input(
        "Wall area A (m²)", value=2.5, min_value=0.001,
        help="Area of wall perpendicular to the direction of heat flow.",
    )
    thickness = st.number_input(
        "Wall thickness L (m)", value=0.012, min_value=0.0001, format="%.4f",
        help="Distance the heat must travel through the wall.",
    )
    t_hot = st.number_input("Hot-side surface temperature (°C)", value=180.0,
                            help="Temperature of the surface facing the hot fluid.")
    t_cold = st.number_input("Cold-side surface temperature (°C)", value=40.0,
                             help="Temperature of the outer surface of the wall.")

try:
    cond = conduction_through_wall(k, area, thickness, t_hot, t_cold)
    with col_out:
        st.metric(
            "Heat transfer rate q",
            f"{U.to_display('power', cond['heat_rate']):,.2f} {U.label('power')}",
        )
        st.metric("Heat flux q″", f"{cond['heat_flux']:,.1f} W/m²")
        st.metric("Thermal resistance R", f"{cond['resistance']:.6f} K/W")
        st.metric("Driving ΔT", f"{cond['delta_t']:.2f} K")
except ValueError as exc:
    col_out.error(f"Input error: {exc}")

st.divider()
st.header("2 · Newton's law of cooling")
st.latex(r"T(t) = T_\infty + (T_0 - T_\infty)e^{-t/\tau}, \qquad \tau = \frac{\rho V c_p}{hA}")

with st.sidebar:
    st.header("Cooling inputs")
    t0 = st.slider("Initial temperature T₀ (°C)", -50.0, 400.0, 90.0,
                   help="Temperature of the object at t = 0.")
    t_inf = st.slider("Ambient temperature T∞ (°C)", -50.0, 200.0, 25.0,
                      help="Surrounding temperature; the object cannot cool below this.")
    t_target = st.slider("Target temperature (°C)", -50.0, 400.0, 40.0,
                         help="Must lie between T₀ and T∞.")
    h = st.slider("Convection coefficient h (W/m²·K)", 1.0, 1000.0, 25.0,
                  help="Still air 5–25, forced air 25–250, water 500–10 000.")
    a_cool = st.number_input("Exposed surface area A (m²)", value=0.6, min_value=0.0001)
    volume = st.number_input("Body volume V (m³)", value=0.02, min_value=0.000001, format="%.6f")
    density = st.number_input("Density ρ (kg/m³)", value=998.0, min_value=0.001)
    cp = st.number_input("Specific heat c_p (J/kg·K)", value=4182.0, min_value=1.0)

try:
    cool = newton_cooling(t0, t_inf, t_target, h, a_cool, volume, density, cp)
    tau = cool["tau"]
    m1, m2, m3 = st.columns(3)
    m1.metric("Time constant τ", f"{tau/60:.2f} min")
    if cool["time_to_target"] is not None:
        m2.metric("Time to target", f"{cool['time_to_target']/60:.2f} min")
    else:
        m2.metric("Time to target", "—")
        st.warning(cool["note"])
    m3.metric("Practically settled (5τ)", f"{5*tau/60:.1f} min")

    st.subheader("Cool-down & flow-assurance advisor")
    risk = st.number_input("Flow-assurance risk temperature (°C)", value=35.0)
    response_h = st.number_input("Available crew response time (h)", value=4.0, min_value=0.1)
    for advice in cooling_advisories(tau, cool["time_to_target"], risk, t0, t_inf, response_h * 3600):
        text = f"**{advice.title}** — {advice.detail}" + (f" _{advice.action}_" if advice.action else "")
        (st.error if advice.severity == "critical" else st.warning if advice.severity == "review" else st.success)(text)

    horizon = max((cool["time_to_target"] or tau * 3) * 1.5, tau * 0.5, 1)
    times = np.linspace(0, horizon, 200)
    curve = pd.DataFrame(
        {
            "Time (min)": times / 60,
            "Temperature (°C)": [temperature_at(t, t0, t_inf, tau) for t in times],
        }
    )
    st.subheader("Cooling curve")
    st.line_chart(curve, x="Time (min)", y="Temperature (°C)")
    st.download_button(
        "⬇️ Export cooling curve (CSV)",
        curve.to_csv(index=False),
        file_name="cooling_curve.csv",
        mime="text/csv",
    )
except ValueError as exc:
    st.error(f"Input error: {exc}")
