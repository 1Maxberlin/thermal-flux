# Fluid Flow & Heat Transfer Engineering Suite

PE 262 Capstone — a deployed, multi-module engineering application for pipe hydraulics,
heat transfer and rock/fluid data analysis.

**Live web app:** _(paste your published URL here)_
**Live Streamlit app:** _(paste your Streamlit Community Cloud URL here)_

## What it does

| Module | What it does |
| --- | --- |
| **A — Pipe Flow Analyser** | Fluid library (water, air, crude oil, brine, natural gas, user-defined) with auto-populated properties; inputs for D, L, ε and Q; outputs velocity, Reynolds number, Darcy friction factor, pressure drop and head loss; ΔP vs Q sweep plot; CSV export of inputs, results and the sweep table. |
| **B — Heat Transfer Calculator** | Steady-state conduction through a flat wall (Fourier's law) and lumped-capacitance Newton cooling, including time to reach a target temperature and a live temperature-vs-time curve. Every input carries a physical description and its unit. |
| **C — Rock & Fluid Dashboard** | CSV upload, summary statistics, cut-off filtering (porosity / permeability / facies), porosity histogram, porosity–permeability crossplot on a log axis, and download of the filtered dataset. |
| **D — Code quality** | Physics isolated in `engineering.py` (`Fluid`, `Pipe` classes + documented functions), docstrings throughout, defensive validation, git history and an AI usage log. |

## Equations used

- Continuity: `v = Q / A`, `A = πD²/4`
- Reynolds number: `Re = ρvD/μ`
- Friction factor: `f = 64/Re` (Re < 2300); Colebrook–White solved iteratively (Re > 4000);
  linear blend across the transitional band
- Darcy–Weisbach: `ΔP = f (L/D)(ρv²/2)`, `h_f = ΔP/(ρg)`
- Fourier's law: `q = kA(T_hot − T_cold)/L`
- Newton cooling: `T(t) = T∞ + (T₀ − T∞)e^(−t/τ)`, `τ = ρVc_p/(hA)`

## Run the Streamlit build locally

```bash
cd streamlit_app
pip install -r requirements.txt
streamlit run app.py
```

Deploy by pointing Streamlit Community Cloud at this repository with
`streamlit_app/app.py` as the entry point.

## Verification

Each correlation was checked by hand before release — for example, water at 20 L/s in a
100 mm commercial-steel line over 250 m gives v = 2.546 m/s, Re = 2.54×10⁵, f = 0.0182 and
ΔP ≈ 147 kPa, which the app reproduces exactly. The full set of worked examples is
on the app's Documentation page.

## AI usage

Three prompts, what was returned, how it was verified and what had to be corrected are
documented on the Documentation page of the app and in the developer report.
