"""app.py — FlowThermal Suite home page (Streamlit Community Cloud entry point).

Run locally with:  streamlit run app.py
"""

import streamlit as st

st.set_page_config(
    page_title="FlowThermal Suite",
    page_icon="🛢️",
    layout="wide",
)

st.title("Fluid Flow & Heat Transfer Engineering Suite")
st.caption("PE 262 Capstone — a working toolkit for pipe hydraulics, heat transfer and core data")

st.markdown(
    """
This application brings together three engineering workflows plus full documentation:

| Module | Page | What it does |
| --- | --- | --- |
| **A** | Pipe Flow Analyser | Velocity, Reynolds number, Colebrook friction factor and Darcy–Weisbach pressure drop, with a ΔP vs Q sweep plot and CSV export |
| **B** | Heat Transfer Calculator | Fourier conduction through a flat wall and Newton cooling with a live temperature-vs-time curve |
| **C** | Rock & Fluid Dashboard | Upload a CSV, view summary statistics, filter by cut-offs, plot a histogram and a porosity–permeability crossplot, download the filtered data |
| **D** | Documentation | Hand-calculation verification, OOP structure, git history and the AI usage log |

All physics lives in the separate `engineering.py` module (`Fluid` and `Pipe` classes plus
documented functions), so the pages contain only interface code.

**Use the sidebar to open a module.**
"""
)

st.info(
    "Every correlation in this suite was verified against a hand calculation before it shipped — "
    "see the Documentation page for the worked examples."
)
