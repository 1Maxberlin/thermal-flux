"""pages/3_Rock_Fluid_Dashboard.py - Module C: petrophysics dashboard.

Interface only - upload a CSV of core/log data (expects columns roughly like
'Porosity' and 'Permeability', but the column pickers below adapt to whatever
headers are actually present in the uploaded file).
"""

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from theme import apply_theme, hero, divider, footer, LOGO_PATH

st.set_page_config(
    page_title="Rock & Fluid Dashboard - FlowThermal",
    page_icon=str(LOGO_PATH) if LOGO_PATH.exists() else "\U0001FAA8",
    layout="wide",
)

apply_theme()

hero(
    title="Rock & Fluid Dashboard",
    subtitle="Module C - upload core/log data, filter by cut-offs, and crossplot porosity against permeability",
    tagline="Every filter you set below re-draws the histogram and crossplot instantly.",
    pills=["CSV upload", "Cut-off filters", "Crossplot"],
)

uploaded = st.file_uploader("Upload a CSV of rock/fluid data", type=["csv"])

if uploaded is None:
    st.markdown(
        """
        <div class="flux-card" style="--accent-a:#8B5CF6; --accent-b:#FB923C; max-width: 640px;">
            <span class="flux-card-icon">\U0001F4C2</span>
            <div class="flux-card-title">Waiting for a file</div>
            <div class="flux-card-desc">
                Upload a CSV with numeric columns (for example <code>Porosity</code> and
                <code>Permeability</code>) to unlock the summary statistics, histogram,
                crossplot and filtered download below.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    footer()
    st.stop()

try:
    df = pd.read_csv(uploaded)
except Exception as e:
    st.error(f"Could not read that file as a CSV: {e}")
    st.stop()

numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

if len(numeric_cols) < 1:
    st.warning("No numeric columns detected in this file — nothing to plot.")
    st.stop()

st.success(f"Loaded {len(df):,} rows and {len(df.columns)} columns.", icon="\u2705")

divider()

# ------------------------------------------------------------------
# Summary statistics
# ------------------------------------------------------------------
st.markdown("#### Summary statistics")
st.dataframe(df[numeric_cols].describe().T, use_container_width=True)

divider()

# ------------------------------------------------------------------
# Column selection + cut-off filters
# ------------------------------------------------------------------
st.markdown("#### Filter by cut-offs")

default_x = next((c for c in numeric_cols if "poro" in c.lower()), numeric_cols[0])
default_y = next(
    (c for c in numeric_cols if "perm" in c.lower()),
    numeric_cols[1] if len(numeric_cols) > 1 else numeric_cols[0],
)

fcol1, fcol2 = st.columns(2)
with fcol1:
    x_col = st.selectbox("X-axis column (e.g. porosity)", numeric_cols, index=numeric_cols.index(default_x))
with fcol2:
    y_col = st.selectbox(
        "Y-axis column (e.g. permeability)",
        numeric_cols,
        index=numeric_cols.index(default_y) if default_y in numeric_cols else 0,
    )

filtered = df.copy()
with st.expander("Adjust cut-off ranges", expanded=True):
    for col in {x_col, y_col}:
        lo, hi = float(df[col].min()), float(df[col].max())
        if lo == hi:
            continue
        sel = st.slider(f"{col} range", min_value=lo, max_value=hi, value=(lo, hi))
        filtered = filtered[(filtered[col] >= sel[0]) & (filtered[col] <= sel[1])]

st.markdown(
    f"""
    <span class="flux-pill">
        <span class="flux-pill-dot"></span>
        {len(filtered):,} of {len(df):,} rows pass the current cut-offs
    </span>
    """,
    unsafe_allow_html=True,
)

divider()

# ------------------------------------------------------------------
# Histogram
# ------------------------------------------------------------------
st.markdown(f"#### Histogram — {x_col}")

hist_fig = go.Figure()
hist_fig.add_trace(
    go.Histogram(
        x=filtered[x_col],
        marker=dict(
            color="rgba(34, 211, 238, 0.55)",
            line=dict(color="#22D3EE", width=1),
        ),
        nbinsx=30,
    )
)
hist_fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(color="#9FB0D0", family="Sora"),
    xaxis=dict(title=x_col, gridcolor="rgba(120,170,255,0.08)"),
    yaxis=dict(title="Count", gridcolor="rgba(120,170,255,0.08)"),
    margin=dict(l=10, r=10, t=10, b=10),
    height=360,
    bargap=0.05,
    transition=dict(duration=400, easing="cubic-in-out"),
)
st.plotly_chart(hist_fig, use_container_width=True, config={"displayModeBar": False})

divider()

# ------------------------------------------------------------------
# Crossplot
# ------------------------------------------------------------------
st.markdown(f"#### Crossplot — {x_col} vs {y_col}")

log_y = st.checkbox("Log scale on Y (typical for permeability)", value="perm" in y_col.lower())

cross_fig = go.Figure()
cross_fig.add_trace(
    go.Scatter(
        x=filtered[x_col],
        y=filtered[y_col],
        mode="markers",
        marker=dict(
            size=8,
            color=filtered[y_col] if log_y else filtered[x_col],
            colorscale=[[0, "#8B5CF6"], [0.5, "#3B82F6"], [1, "#22D3EE"]],
            line=dict(width=0.5, color="rgba(255,255,255,0.25)"),
            showscale=True,
            colorbar=dict(title=y_col, tickfont=dict(color="#9FB0D0")),
        ),
    )
)
cross_fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(color="#9FB0D0", family="Sora"),
    xaxis=dict(title=x_col, gridcolor="rgba(120,170,255,0.08)"),
    yaxis=dict(
        title=y_col,
        gridcolor="rgba(120,170,255,0.08)",
        type="log" if log_y else "linear",
    ),
    margin=dict(l=10, r=10, t=10, b=10),
    height=460,
    transition=dict(duration=400, easing="cubic-in-out"),
)
st.plotly_chart(cross_fig, use_container_width=True, config={"displayModeBar": False})

divider()

# ------------------------------------------------------------------
# Filtered data + download
# ------------------------------------------------------------------
st.markdown("#### Filtered data")
st.dataframe(filtered, use_container_width=True, height=280)

st.download_button(
    "Download filtered data as CSV",
    data=filtered.to_csv(index=False).encode("utf-8"),
    file_name="filtered_rock_fluid_data.csv",
    mime="text/csv",
)

footer()
