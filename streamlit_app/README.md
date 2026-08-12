# Thermaflux — Flow & Thermal Engineering Studio

Two builds of the same engineering toolkit share one physics core:

- **Web app** (this repository root) — TanStack Start + React, deployed from Lovable.
- **Streamlit app** (`streamlit_app/`) — pure Python build for Streamlit Community Cloud.

## Modules

| Page | What it does |
| --- | --- |
| Pipe Flow Analyser | Velocity, Reynolds number, Colebrook–White friction factor, Darcy–Weisbach pressure drop, ΔP-vs-Q sweep, pumping economics, API RP 14E erosion screening, CSV export |
| Heat Transfer Calculator | Fourier conduction through a flat wall, lumped-capacitance Newton cooling, live cooling curve, cool-down / flow-assurance advisor, CSV export |
| Rock & Fluid Dashboard | CSV upload, summary statistics, cut-off filters, porosity histogram, porosity–permeability crossplot, Winland r35 / heterogeneity screening, filtered CSV download |
| Units | Switch every quantity between SI and oilfield units (in, ft, bbl/d, psi, °F) or mix them per quantity |

## Python source layout

```
streamlit_app/
  app.py                       entry point (home page)
  engineering.py               Fluid & Pipe classes + documented physics functions
  advisors.py                  decision-support rules (erosion, economics, r35, Biot)
  units.py                     SI <-> oilfield unit conversion layer
  requirements.txt
  pages/
    1_Pipe_Flow_Analyser.py
    2_Heat_Transfer_Calculator.py
    3_Rock_Fluid_Dashboard.py
    4_Units.py
```

All physics and screening logic live in `engineering.py` and `advisors.py`; the page
files contain interface code only.

## Run the Streamlit build locally

```bash
cd streamlit_app
pip install -r requirements.txt
streamlit run app.py
```

## Ship it to Streamlit Community Cloud

1. Push this repository to GitHub (public or a repo your Streamlit account can read).
2. Go to <https://share.streamlit.io> and sign in with that GitHub account.
3. Click **Create app → Deploy a public app from GitHub**.
4. Fill the form:
   - **Repository:** `your-username/your-repo`
   - **Branch:** `main`
   - **Main file path:** `streamlit_app/app.py`
   - **Python version:** 3.11
5. Click **Deploy**. Streamlit installs `streamlit_app/requirements.txt` automatically
   because it sits next to the entry point.
6. Copy the resulting `https://<app-name>.streamlit.app` URL and paste it below and into
   your submission.
7. Every push to `main` redeploys automatically; use **Manage app → Reboot** if a
   dependency change needs a clean install.

**Live Streamlit app:** _(paste your streamlit.app URL here)_
**Live web app:** _(paste your published URL here)_

## Equations

- Continuity `v = Q/A`, `A = πD²/4`
- Reynolds `Re = ρvD/μ`
- Friction factor `f = 64/Re` (Re < 2300); Colebrook–White solved iteratively (Re > 4000);
  blended across the transition band
- Darcy–Weisbach `ΔP = f (L/D)(ρv²/2)`, `h_f = ΔP/(ρg)`
- Fourier `q = kA(T_hot − T_cold)/L`
- Newton cooling `T(t) = T∞ + (T₀ − T∞)e^(−t/τ)`, `τ = ρVc_p/(hA)`
- API RP 14E erosional velocity `v_e = C/√ρ`
- Winland `log r35 = 0.732 + 0.588 log k − 0.864 log φ`

## Verification

Water at 20 L/s in a 100 mm commercial-steel line over 250 m gives v = 2.546 m/s,
Re = 2.54×10⁵, f = 0.0182 and ΔP ≈ 147 kPa — reproduced exactly by both builds.
