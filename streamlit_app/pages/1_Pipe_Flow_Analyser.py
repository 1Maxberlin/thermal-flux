"""pages/1_Pipe_Flow_Analyser.py — Module A: pipe hydraulics.

Interface only — all physics comes from engineering.py (Fluid, Pipe).
"""

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from theme import apply_theme, hero, divider, footer, LOGO_PATH

# ------------------------------------------------------------------
# Your existing physics module — unchanged import contract.
# Adjust the class/function names below only if yours differ.
# ------------------------------------------------------------------
from engineering import Fluid, Pipe  # noqa: E402

st.set_page_config(
    page_title="Pipe Flow Analyser · FlowThermal",
    page_icon=str(LOGO_PATH) if LOGO_PATH.exists() else "🧮",
    layout="wide",
)

apply_theme()

hero(
    title="Pipe Flow Analyser",
    subtitle="Module A — velocity, Reynolds number, Colebrook friction factor and Darcy–Weisbach pressure drop",
    tagline="Adjust the inputs on the left; every chart and table updates live.",
    pills=["Darcy–Weisbach", "Colebrook–White", "CSV export"],
)

# ------------------------------------------------------------------
# Inputs
# ------------------------------------------------------------------
with st.sidebar:
    st.markdown("### Pipe & fluid inputs")
    diameter_mm = st.number_input("Internal diameter (mm)", min_value=1.0, value=100.0, step=1.0)
    length_m = st.number_input("Pipe length (m)", min_value=0.1, value=50.0, step=1.0)
    roughness_mm = st.number_input("Absolute roughness ε (mm)", min_value=0.0, value=0.045, step=0.001, format="%.3f")
    flow_lps = st.number_input("Flow rate Q (L/s)", min_value=0.01, value=5.0, step=0.1)

    st.markdown("### Fluid properties")
    density = st.number_input("Density ρ (kg/m³)", min_value=1.0, value=998.0, step=1.0)
    viscosity_cp = st.number_input("Dynamic viscosity μ (cP)", min_value=0.001, value=1.0, step=0.01)

    st.markdown("")
    run = st.button("Calculate", use_container_width=True)

# ------------------------------------------------------------------
# Calculation — wire these calls up to your actual Fluid / Pipe API.
# The try/except keeps the page usable even before that's finalised.
# ------------------------------------------------------------------
def compute(diameter_mm, length_m, roughness_mm, flow_lps, density, viscosity_cp):
    d = diameter_mm / 1000
    q = flow_lps / 1000
    mu = viscosity_cp / 1000
    area = np.pi * (d ** 2) / 4
    velocity = q / area
    reynolds = density * velocity * d / mu

    # Colebrook-White, solved iteratively (Newton) - swap for your Pipe class method if named differently
    eps_over_d = (roughness_mm / 1000) / d
    f = 0.02
    for _ in range(50):
        rhs = -2 * np.log10(eps_over_d / 3.7 + 2.51 / (reynolds * np.sqrt(f)))
        f_new = 1 / rhs ** 2
        if abs(f_new - f) < 1e-10:
            f = f_new
            break
        f = f_new

    dp = f * (length_m / d) * (density * velocity ** 2 / 2)
    return velocity, reynolds, f, dp


try:
    velocity, reynolds, friction, dp = compute(
        diameter_mm, length_m, roughness_mm, flow_lps, density, viscosity_cp
    )
    engine_ok = True
except Exception as e:
    engine_ok = False
    st.error(f"Calculation engine error - check engineering.py wiring: {e}")
    velocity = reynolds = friction = dp = 0.0

regime = "Laminar" if reynolds < 2300 else ("Transitional" if reynolds < 4000 else "Turbulent")
regime_color = {"Laminar": "#34D399", "Transitional": "#F59E0B", "Turbulent": "#22D3EE"}[regime]

# ------------------------------------------------------------------
# Results - animated metric cards
# ------------------------------------------------------------------
st.markdown("#### Results")
m1, m2, m3, m4 = st.columns(4)
metrics = [
    (m1, "Velocity", f"{velocity:.3f}", "m/s"),
    (m2, "Reynolds number", f"{reynolds:,.0f}", ""),
    (m3, "Friction factor (f)", f"{friction:.5f}", ""),
    (m4, "Pressure drop \u0394P", f"{dp/1000:.2f}", "kPa"),
]
for col, label, value, unit in metrics:
    with col:
        st.markdown(
            f"""
            <div class="flux-metric">
                <div class="flux-metric-label">{label}</div>
                <div class="flux-metric-value">{value}<span class="flux-metric-unit">{unit}</span></div>
            </div>
            """,
            unsafe_allow_html=True,
        )

st.markdown(
    f"""
    <div style="margin-top:1rem;">
        <span class="flux-pill" style="border-color:{regime_color}55; background:{regime_color}18; color:{regime_color};">
            <span class="flux-pill-dot" style="background:{regime_color}; box-shadow:0 0 8px {regime_color};"></span>
            {regime} flow regime
        </span>
    </div>
    """,
    unsafe_allow_html=True,
)

divider()

# ------------------------------------------------------------------
# dP vs Q sweep plot
# ------------------------------------------------------------------
st.markdown("#### \u0394P vs Q sweep")

q_range = np.linspace(max(flow_lps * 0.1, 0.1), flow_lps * 3, 60)
dp_values = []
for q_i in q_range:
    _, _, _, dp_i = compute(diameter_mm, length_m, roughness_mm, q_i, density, viscosity_cp)
    dp_values.append(dp_i / 1000)

fig = go.Figure()
fig.add_trace(
    go.Scatter(
        x=q_range,
        y=dp_values,
        mode="lines",
        line=dict(color="#22D3EE", width=3, shape="spline"),
        fill="tozeroy",
        fillcolor="rgba(34, 211, 238, 0.10)",
        name="\u0394P",
    )
)
fig.add_trace(
    go.Scatter(
        x=[flow_lps],
        y=[dp / 1000],
        mode="markers",
        marker=dict(size=13, color="#FB923C", line=dict(width=2, color="#0D1424")),
        name="Operating point",
    )
)
fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(color="#9FB0D0", family="Sora"),
    xaxis=dict(title="Flow rate Q (L/s)", gridcolor="rgba(120,170,255,0.08)", zeroline=False),
    yaxis=dict(title="Pressure drop \u0394P (kPa)", gridcolor="rgba(120,170,255,0.08)", zeroline=False),
    margin=dict(l=10, r=10, t=10, b=10),
    height=420,
    showlegend=True,
    legend=dict(bgcolor="rgba(0,0,0,0)"),
    transition=dict(duration=400, easing="cubic-in-out"),
)
st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

divider()

# ------------------------------------------------------------------
# Export
# ------------------------------------------------------------------
st.markdown("#### Export sweep data")
sweep_df = pd.DataFrame({"Flow rate (L/s)": q_range, "Pressure drop (kPa)": dp_values})
st.dataframe(sweep_df, use_container_width=True, height=220)

csv = sweep_df.to_csv(index=False).encode("utf-8")
st.download_button(
    "Download sweep as CSV",
    data=csv,
    file_name="pipe_flow_sweep.csv",
    mime="text/csv",
    use_container_width=False,
)

footer()
