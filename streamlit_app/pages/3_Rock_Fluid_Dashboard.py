"""Module C — Rock & Fluid Data Dashboard (Streamlit page)."""

import matplotlib.pyplot as plt
import pandas as pd
import streamlit as st

st.set_page_config(page_title="Rock & Fluid Dashboard", page_icon="📊", layout="wide")
st.title("Module C · Rock & Fluid Data Dashboard")
st.caption("Upload core-analysis or fluid data, filter it, visualise it and export it")


@st.cache_data
def load_csv(file) -> pd.DataFrame:
    """Read an uploaded CSV into a DataFrame, raising a readable error if empty."""
    df = pd.read_csv(file)
    if df.empty:
        raise ValueError("The uploaded file contains no data rows.")
    return df


uploaded = st.file_uploader("Upload a CSV file (first row = column names)", type="csv")

if uploaded is None:
    st.info("Upload a CSV to begin. Columns such as porosity_pct and permeability_mD are detected automatically.")
    st.stop()

try:
    data = load_csv(uploaded)
except (ValueError, pd.errors.ParserError, pd.errors.EmptyDataError) as exc:
    st.error(f"Could not read that file: {exc}")
    st.stop()

st.success(f"Loaded {len(data)} rows × {len(data.columns)} columns from {uploaded.name}")
numeric_cols = list(data.select_dtypes("number").columns)
if len(numeric_cols) < 2:
    st.error("At least two numeric columns are needed for the crossplot.")
    st.stop()

por_default = next((c for c in numeric_cols if "poro" in c.lower()), numeric_cols[0])
perm_default = next((c for c in numeric_cols if "perm" in c.lower()), numeric_cols[1])

with st.sidebar:
    st.header("Filters")
    por_col = st.selectbox("Porosity column", numeric_cols, index=numeric_cols.index(por_default))
    perm_col = st.selectbox("Permeability column", numeric_cols, index=numeric_cols.index(perm_default))
    min_por = st.slider(
        f"Minimum {por_col}",
        float(data[por_col].min()), float(data[por_col].max()), float(data[por_col].min()),
    )
    min_perm = st.slider(
        f"Minimum {perm_col}",
        float(data[perm_col].min()), float(data[perm_col].max()), float(data[perm_col].min()),
    )

filtered = data[(data[por_col] >= min_por) & (data[perm_col] >= min_perm)]

st.subheader("Summary statistics (filtered)")
st.dataframe(filtered.describe().T, use_container_width=True)

c1, c2 = st.columns(2)
with c1:
    st.subheader(f"{por_col} histogram")
    fig, ax = plt.subplots()
    ax.hist(filtered[por_col].dropna(), bins=12, edgecolor="white")
    ax.set_xlabel(por_col)
    ax.set_ylabel("Sample count")
    ax.grid(alpha=0.3)
    st.pyplot(fig)

with c2:
    st.subheader(f"{por_col} vs {perm_col} crossplot")
    fig2, ax2 = plt.subplots()
    ax2.scatter(filtered[por_col], filtered[perm_col], alpha=0.75)
    if (filtered[perm_col] > 0).all() and len(filtered) > 0:
        ax2.set_yscale("log")
    ax2.set_xlabel(por_col)
    ax2.set_ylabel(f"{perm_col} (log scale)")
    ax2.grid(alpha=0.3, which="both")
    st.pyplot(fig2)

st.subheader(f"Filtered data ({len(filtered)} of {len(data)} rows)")
st.dataframe(filtered, use_container_width=True)
st.download_button(
    "⬇️ Download filtered data (CSV)",
    filtered.to_csv(index=False),
    file_name=f"filtered_{uploaded.name}",
    mime="text/csv",
)
