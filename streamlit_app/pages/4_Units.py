"""Units page — pick SI or oilfield units for every calculation."""

import sys
from pathlib import Path

import streamlit as st

sys.path.append(str(Path(__file__).resolve().parents[1]))
import units as U  # noqa: E402

st.set_page_config(page_title="Units", page_icon="📐", layout="wide")
st.title("Units & Preferences")
st.caption("All physics runs in SI internally; this page only changes how values are shown and entered.")

prefs = U.preferences()
current = "Field" if prefs == U.FIELD_DEFAULTS else ("SI" if prefs == U.SI_DEFAULTS else "Custom")
st.info(f"Active system: **{current}**")

col1, col2 = st.columns(2)
if col1.button("Use SI / metric", use_container_width=True):
    U.apply_system("SI")
    st.rerun()
if col2.button("Use oilfield units", use_container_width=True):
    U.apply_system("Field")
    st.rerun()

st.subheader("Per-quantity units")
for quantity in U.QUANTITIES:
    choices = U.options(quantity)
    picked = st.selectbox(
        quantity.replace("_", " ").title(),
        choices,
        index=choices.index(prefs.get(quantity, choices[0])),
        key=f"unit_{quantity}",
    )
    prefs[quantity] = picked

st.session_state["units"] = prefs
st.success("Preferences apply immediately to the Pipe Flow and Heat Transfer pages.")
