"""app.py — FlowThermal Suite home page (Streamlit Community Cloud entry point).

Run locally with:  streamlit run app.py
"""

import streamlit as st

from theme import apply_theme, hero, module_card, divider, footer, LOGO_PATH

st.set_page_config(
    page_title="FlowThermal Suite",
    page_icon=str(LOGO_PATH) if LOGO_PATH.exists() else "🛢️",
    layout="wide",
    initial_sidebar_state="expanded",
)

apply_theme()

# ----------------------------------------------------------------------
# Hero
# ----------------------------------------------------------------------
hero(
    title="FlowThermal Suite",
    subtitle="PE 262 Capstone — a working toolkit for pipe hydraulics, heat transfer and core data",
    tagline="Three engineering workflows, one shared physics engine, zero guesswork.",
    pills=["Live", "3 modules", "Hand-calc verified"],
)

# ----------------------------------------------------------------------
# Intro line
# ----------------------------------------------------------------------
st.markdown(
    "This application brings together three engineering workflows plus full "
    "documentation. Open a module from the sidebar, or click a card below."
)

st.write("")

# ----------------------------------------------------------------------
# Module cards (A, B, C) — animated, staggered fade-in
# ----------------------------------------------------------------------
col1, col2, col3 = st.columns(3, gap="medium")

with col1:
    st.markdown(
        module_card(
            icon="🧮",
            title="A · Pipe Flow Analyser",
            desc="Velocity, Reynolds number, Colebrook friction factor and "
                 "Darcy–Weisbach pressure drop, with a ΔP vs Q sweep plot and CSV export.",
            tag="Fluid mechanics",
            accent="cyan-blue",
            delay=0.05,
        ),
        unsafe_allow_html=True,
    )
    st.page_link("pages/1_Pipe_Flow_Analyser.py", label="Open Pipe Flow Analyser →", icon="🧮")

with col2:
    st.markdown(
        module_card(
            icon="🔥",
            title="B · Heat Transfer Calculator",
            desc="Fourier conduction through a flat wall and Newton cooling, "
                 "with a live temperature-vs-time curve.",
            tag="Heat transfer",
            accent="blue-violet",
            delay=0.15,
        ),
        unsafe_allow_html=True,
    )
    st.page_link("pages/2_Heat_Transfer_Calculator.py", label="Open Heat Transfer Calculator →", icon="🔥")

with col3:
    st.markdown(
        module_card(
            icon="🪨",
            title="C · Rock & Fluid Dashboard",
            desc="Upload a CSV, view summary statistics, filter by cut-offs, plot a "
                 "histogram and a porosity–permeability crossplot, download the result.",
            tag="Petrophysics",
            accent="violet-flame",
            delay=0.25,
        ),
        unsafe_allow_html=True,
    )
    st.page_link("pages/3_Rock_Fluid_Dashboard.py", label="Open Rock & Fluid Dashboard →", icon="🪨")

divider()

# ----------------------------------------------------------------------
# Documentation strip + architecture note
# ----------------------------------------------------------------------
left, right = st.columns([1.3, 1], gap="large")

with left:
    st.markdown("#### How it's built")
    st.markdown(
        """
All physics lives in a separate `engineering.py` module (`Fluid` and `Pipe` classes
plus documented functions), so every page you open here contains interface code only —
the calculations themselves are unit-tested and version-controlled independently of
the UI.
        """
    )
    st.markdown(
        module_card(
            icon="📘",
            title="D · Documentation",
            desc="Hand-calculation verification, OOP structure, git history and the "
                 "AI usage log — the full paper trail behind every number this app produces.",
            tag="Reference",
            accent="amber-flame",
            delay=0.35,
        ),
        unsafe_allow_html=True,
    )
    st.page_link("pages/4_Units.py", label="Open Documentation / Units →", icon="📘")

with right:
    st.markdown("#### Quick facts")
    st.markdown('<div class="flux-metric">', unsafe_allow_html=True)
    st.markdown('<div class="flux-metric-label">Correlations verified</div>', unsafe_allow_html=True)
    st.markdown('<div class="flux-metric-value">100<span class="flux-metric-unit">%</span></div>', unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)
    st.write("")
    st.markdown('<div class="flux-metric">', unsafe_allow_html=True)
    st.markdown('<div class="flux-metric-label">Active modules</div>', unsafe_allow_html=True)
    st.markdown('<div class="flux-metric-value">3</div>', unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)
    st.write("")
    st.markdown('<div class="flux-metric">', unsafe_allow_html=True)
    st.markdown('<div class="flux-metric-label">Physics engine</div>', unsafe_allow_html=True)
    st.markdown('<div class="flux-metric-value" style="font-size:1.05rem;">engineering.py</div>', unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

divider()

st.info(
    "Every correlation in this suite was verified against a hand calculation before it "
    "shipped — see the Documentation page for the worked examples.",
    icon="✅",
)

footer()
