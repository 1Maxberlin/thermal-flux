"""pages/2_Heat_Transfer_Calculator.py - Module B: heat transfer.

Interface only - all physics comes from engineering.py.
"""

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from theme import apply_theme, hero, divider, footer, LOGO_PATH

st.set_page_config(
    page_title="Heat Transfer Calculator - FlowThermal",
    page_icon=str(LOGO_PATH) if LOGO_PATH.exists() else "\U0001F525",
    layout="wide",
)

apply_theme()

hero(
    title="Heat Transfer Calculator",
    subtitle="Module B - Fourier conduction through a flat wall and Newton cooling, live over time",
    tagline="Two classic modes: steady-state conduction, and a transient cooling curve.",
    pills=["Fourier conduction", "Newton cooling", "Live curve"],
)

mode = st.radio(
    "Choose a calculation",
    ["Conduction through a flat wall", "Newton cooling over time"],
    horizontal=True,
)

divider()

# ------------------------------------------------------------------
# Mode 1: steady-state conduction (Fourier's law)
# ------------------------------------------------------------------
if mode == "Conduction through a flat wall":

    with st.sidebar:
        st.markdown("### Wall & temperature inputs")
        k = st.number_input("Thermal conductivity k (W/m\u00b7K)", min_value=0.001, value=0.8, step=0.01)
        thickness_mm = st.number_input("Wall thickness L (mm)", min_value=0.1, value=200.0, step=1.0)
        area_m2 = st.number_input("Cross-sectional area A (m\u00b2)", min_value=0.001, value=1.0, step=0.1)
        t_hot = st.number_input("Hot-face temperature T\u2081 (\u00b0C)", value=90.0, step=1.0)
        t_cold = st.number_input("Cold-face temperature T\u2082 (\u00b0C)", value=20.0, step=1.0)

    L = thickness_mm / 1000
    dT = t_hot - t_cold
    q_flux = k * dT / L          # W/m^2
    q_total = q_flux * area_m2   # W
    resistance = L / (k * area_m2)

    st.markdown("#### Results")
    c1, c2, c3 = st.columns(3)
    for col, label, value, unit in [
        (c1, "Heat flux q\u2033", f"{q_flux:,.1f}", "W/m\u00b2"),
        (c2, "Total heat rate Q", f"{q_total:,.1f}", "W"),
        (c3, "Thermal resistance R", f"{resistance:.4f}", "K/W"),
    ]:
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

    divider()

    st.markdown("#### Temperature profile through the wall")
    x = np.linspace(0, L, 100)
    temps = t_hot - (dT / L) * x

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=x * 1000,
            y=temps,
            mode="lines",
            line=dict(color="#FB923C", width=4, shape="linear"),
            fill="tozeroy",
            fillcolor="rgba(251, 146, 60, 0.10)",
            name="Temperature",
        )
    )
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#9FB0D0", family="Sora"),
        xaxis=dict(title="Position through wall (mm)", gridcolor="rgba(120,170,255,0.08)"),
        yaxis=dict(title="Temperature (\u00b0C)", gridcolor="rgba(120,170,255,0.08)"),
        margin=dict(l=10, r=10, t=10, b=10),
        height=380,
        transition=dict(duration=400, easing="cubic-in-out"),
    )
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

# ------------------------------------------------------------------
# Mode 2: Newton cooling (transient)
# ------------------------------------------------------------------
else:
    with st.sidebar:
        st.markdown("### Cooling inputs")
        t0 = st.number_input("Initial temperature T\u2080 (\u00b0C)", value=95.0, step=1.0)
        t_amb = st.number_input("Ambient temperature T\u2090 (\u00b0C)", value=22.0, step=1.0)
        h = st.number_input("Convective coefficient h (W/m\u00b2\u00b7K)", min_value=0.1, value=15.0, step=0.5)
        area_m2 = st.number_input("Surface area A (m\u00b2)", min_value=0.001, value=0.5, step=0.05)
        mass = st.number_input("Mass m (kg)", min_value=0.001, value=2.0, step=0.1)
        cp = st.number_input("Specific heat c\u209a (J/kg\u00b7K)", min_value=1.0, value=4186.0, step=10.0)
        duration_s = st.number_input("Simulate for (s)", min_value=10, value=1800, step=60)

    tau = (mass * cp) / (h * area_m2)  # time constant
    t = np.linspace(0, duration_s, 300)
    temps = t_amb + (t0 - t_amb) * np.exp(-t / tau)

    st.markdown("#### Results")
    c1, c2, c3 = st.columns(3)
    for col, label, value, unit in [
        (c1, "Time constant \u03c4", f"{tau:,.1f}", "s"),
        (c2, "Temp. after simulated time", f"{temps[-1]:.2f}", "\u00b0C"),
        (c3, "Time to reach T\u2090 + 1\u00b0C", f"{(-tau*np.log(1/(t0-t_amb))):,.0f}" if t0 - t_amb > 1 else "-", "s"),
    ]:
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

    divider()

    st.markdown("#### Temperature vs time")

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=t,
            y=temps,
            mode="lines",
            line=dict(color="#22D3EE", width=4, shape="spline"),
            fill="tozeroy",
            fillcolor="rgba(34, 211, 238, 0.10)",
            name="Object temperature",
        )
    )
    fig.add_hline(
        y=t_amb,
        line_dash="dot",
        line_color="rgba(159,176,208,0.5)",
        annotation_text="Ambient",
        annotation_font_color="#9FB0D0",
    )
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#9FB0D0", family="Sora"),
        xaxis=dict(title="Time (s)", gridcolor="rgba(120,170,255,0.08)"),
        yaxis=dict(title="Temperature (\u00b0C)", gridcolor="rgba(120,170,255,0.08)"),
        margin=dict(l=10, r=10, t=10, b=10),
        height=420,
        transition=dict(duration=400, easing="cubic-in-out"),
    )
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    divider()
    st.markdown("#### Export curve")
    curve_df = pd.DataFrame({"Time (s)": t, "Temperature (\u00b0C)": temps})
    st.dataframe(curve_df, use_container_width=True, height=220)
    st.download_button(
        "Download curve as CSV",
        data=curve_df.to_csv(index=False).encode("utf-8"),
        file_name="cooling_curve.csv",
        mime="text/csv",
    )

footer()
