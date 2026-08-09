"""Module A — Pipe Flow Analyser (Streamlit page)."""

import io
import sys
from pathlib import Path

import pandas as pd
import streamlit as st

sys.path.append(str(Path(__file__).resolve().parents[1]))
from engineering import FLUID_LIBRARY, Fluid, Pipe  # noqa: E402

st.set_page_config(page_title="Pipe Flow Analyser", page_icon="🔧", layout="wide")
st.title("Module A · Pipe Flow Analyser")
st.caption("Darcy–Weisbach pressure drop with the Colebrook–White friction factor")

ROUGHNESS = {
    "Drawn tubing / PVC": 0.0015,
    "Commercial steel": 0.045,
    "Galvanised iron": 0.15,
    "Cast iron": 0.26,
    "Concrete (rough)": 3.0,
}

with st.sidebar:
    st.header("Inputs")
    choice = st.selectbox("Fluid", list(FLUID_LIBRARY) + ["User-defined"])
    if choice == "User-defined":
        rho = st.number_input("Density ρ (kg/m³)", value=900.0, min_value=0.001)
        mu = st.number_input("Dynamic viscosity μ (Pa·s)", value=0.005, min_value=1e-9, format="%.6f")
        fluid = Fluid("User-defined", rho, mu)
    else:
        fluid = FLUID_LIBRARY[choice]
        st.write(f"ρ = **{fluid.density:.3f} kg/m³**, μ = **{fluid.viscosity:.3e} Pa·s**")

    d_mm = st.number_input("Internal diameter D (mm)", value=100.0, min_value=0.1)
    length = st.number_input("Pipe length L (m)", value=250.0, min_value=0.01)
    material = st.selectbox("Wall material", list(ROUGHNESS))
    eps_mm = st.number_input("Absolute roughness ε (mm)", value=ROUGHNESS[material], min_value=0.0)
    q_lps = st.slider("Flow rate Q (L/s)", 0.1, 200.0, 20.0, 0.1)

try:
    pipe = Pipe(d_mm / 1000, length, eps_mm / 1000)
    q = q_lps / 1000
    res = pipe.analyse(fluid, q)

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Velocity", f"{res['velocity']:.3f} m/s")
    c2.metric("Reynolds number", f"{res['reynolds']:,.0f}", res["regime"])
    c3.metric("Friction factor", f"{res['friction_factor']:.4f}")
    c4.metric("Pressure drop", f"{res['pressure_drop']/1000:.3f} kPa", f"{res['head_loss']:.2f} m head")

    sweep = pd.DataFrame(
        [
            {
                "Flow rate (L/s)": qi * 1000,
                "Pressure drop (kPa)": pipe.analyse(fluid, qi)["pressure_drop"] / 1000,
            }
            for qi in [max(q, 1e-6) * 2 * (i + 1) / 60 for i in range(60)]
        ]
    )
    st.subheader("Pressure drop vs flow rate")
    st.line_chart(sweep, x="Flow rate (L/s)", y="Pressure drop (kPa)")

    st.subheader("Detailed results")
    detail = pd.DataFrame(
        {
            "Parameter": [
                "Fluid", "Density (kg/m3)", "Viscosity (Pa.s)", "Diameter (mm)", "Length (m)",
                "Roughness (mm)", "Flow rate (L/s)", "Velocity (m/s)", "Reynolds (-)",
                "Regime", "Friction factor (-)", "Pressure drop (Pa)", "Head loss (m)",
            ],
            "Value": [
                fluid.name, fluid.density, fluid.viscosity, d_mm, length, eps_mm, q_lps,
                res["velocity"], res["reynolds"], res["regime"], res["friction_factor"],
                res["pressure_drop"], res["head_loss"],
            ],
        }
    )
    st.dataframe(detail, use_container_width=True, hide_index=True)

    buffer = io.StringIO()
    detail.to_csv(buffer, index=False)
    buffer.write("\n")
    sweep.to_csv(buffer, index=False)
    st.download_button(
        "⬇️ Export results to CSV",
        buffer.getvalue(),
        file_name="pipe_flow_results.csv",
        mime="text/csv",
    )
except ValueError as exc:
    st.error(f"Input error: {exc}")
