"""pages/4_Units.py - Module D: documentation, verification and unit reference.

Interface only. Replace the placeholder text/tables below with your real
hand-calc verification, OOP notes, git history and AI usage log content -
the structure and styling are ready to receive it.
"""

import streamlit as st

from theme import apply_theme, hero, divider, footer, LOGO_PATH

st.set_page_config(
    page_title="Documentation - FlowThermal",
    page_icon=str(LOGO_PATH) if LOGO_PATH.exists() else "\U0001F4D8",
    layout="wide",
)

apply_theme()

hero(
    title="Documentation",
    subtitle="Module D - hand-calculation verification, OOP structure, git history and the AI usage log",
    tagline="The paper trail behind every number this app produces.",
    pills=["Verified", "Open source"],
)

tab1, tab2, tab3, tab4 = st.tabs(
    ["Hand-calc verification", "OOP structure", "Git history", "AI usage log"]
)

with tab1:
    st.markdown("#### Worked examples")
    st.markdown(
        """
        Each correlation used in this suite (Colebrook-White friction factor,
        Darcy-Weisbach pressure drop, Fourier conduction, Newton cooling) was checked
        by hand against a textbook or reference example before being wired into the
        app. Drop your worked examples here - one expander per calculation reads
        well and keeps the page scannable.
        """
    )
    with st.expander("Example: Colebrook-White friction factor", expanded=False):
        st.latex(r"\frac{1}{\sqrt{f}} = -2\log_{10}\left(\frac{\varepsilon/D}{3.7} + \frac{2.51}{Re\sqrt{f}}\right)")
        st.markdown("Replace this block with your actual hand-calculated check and the matching app output.")
    with st.expander("Example: Darcy-Weisbach pressure drop", expanded=False):
        st.latex(r"\Delta P = f \cdot \frac{L}{D} \cdot \frac{\rho v^2}{2}")
        st.markdown("Replace this block with your actual hand-calculated check and the matching app output.")
    with st.expander("Example: Fourier conduction", expanded=False):
        st.latex(r"q'' = k \cdot \frac{\Delta T}{L}")
        st.markdown("Replace this block with your actual hand-calculated check and the matching app output.")

divider()

with tab2:
    st.markdown("#### Object-oriented structure")
    st.markdown(
        """
        All physics lives in `engineering.py`, kept separate from every page's
        interface code:
        """
    )
    st.code(
        """
engineering.py
├── class Fluid
│   ├── density, viscosity properties
│   └── ...
├── class Pipe
│   ├── velocity(), reynolds_number()
│   ├── friction_factor()       # Colebrook-White
│   └── pressure_drop()          # Darcy-Weisbach
└── documented, unit-tested functions used by both classes
        """,
        language="text",
    )
    st.markdown(
        "This keeps every Streamlit page (`app.py`, `pages/*.py`) limited to "
        "reading inputs, calling into `engineering.py`, and rendering results — "
        "no physics logic duplicated across pages."
    )

divider()

with tab3:
    st.markdown("#### Git history")
    st.markdown(
        "Link or embed your commit log / development timeline here. A simple "
        "approach is to paste `git log --oneline --graph` output into a code block, "
        "or link directly to the GitHub commit history."
    )
    st.link_button(
        "View commit history on GitHub",
        "https://github.com/1Maxberlin/thermal-flux/commits/main",
    )

divider()

with tab4:
    st.markdown("#### AI usage log")
    st.markdown(
        "A transparent record of where AI assistance was used during this "
        "capstone (e.g. UI styling, boilerplate, debugging help) versus where "
        "the engineering logic and verification were done independently."
    )
    st.info(
        "Fill this table in with real entries: date, tool used, what it was used for, "
        "and how the output was verified.",
        icon="\U0001F4DD",
    )
    st.dataframe(
        {
            "Date": ["—"],
            "Tool": ["—"],
            "Used for": ["—"],
            "Verified by": ["—"],
        },
        use_container_width=True,
    )

footer()
