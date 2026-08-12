"""theme.py — Shared visual identity for the FlowThermal Suite.

Import `apply_theme()` at the top of every page (app.py and each file in
pages/) to get consistent fonts, colours, animated backgrounds and the
reusable component helpers (hero header, metric cards, module cards).

Nothing in here touches engineering.py or any calculation logic — this
file is presentation only.
"""

from pathlib import Path
import base64
import streamlit as st

ASSETS_DIR = Path(__file__).parent / "assets"
LOGO_PATH = ASSETS_DIR / "logo.png"

# ----------------------------------------------------------------------
# Palette — pulled from the droplet/flame logo (cyan -> blue -> violet,
# with an amber flame accent for warnings/highlights)
# ----------------------------------------------------------------------
COLORS = {
    "bg": "#070B14",
    "bg_soft": "#0D1424",
    "panel": "#111A2E",
    "panel_border": "rgba(120, 170, 255, 0.14)",
    "cyan": "#22D3EE",
    "blue": "#3B82F6",
    "violet": "#8B5CF6",
    "amber": "#F59E0B",
    "flame": "#FB923C",
    "text": "#E8EEFC",
    "text_soft": "#9FB0D0",
    "text_faint": "#5D6C8C",
    "success": "#34D399",
}


@st.cache_data(show_spinner=False)
def _logo_base64() -> str | None:
    """Read the logo once per session and cache it as base64 for inline CSS/HTML use."""
    if not LOGO_PATH.exists():
        return None
    return base64.b64encode(LOGO_PATH.read_bytes()).decode()


def apply_theme(page_icon_only: bool = False) -> None:
    """Inject the shared CSS. Call once, immediately after st.set_page_config()."""

    logo_b64 = _logo_base64()
    logo_src = f"data:image/png;base64,{logo_b64}" if logo_b64 else ""

    st.markdown(
        f"""
        <style>

        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        :root {{
            --bg: {COLORS['bg']};
            --bg-soft: {COLORS['bg_soft']};
            --panel: {COLORS['panel']};
            --panel-border: {COLORS['panel_border']};
            --cyan: {COLORS['cyan']};
            --blue: {COLORS['blue']};
            --violet: {COLORS['violet']};
            --amber: {COLORS['amber']};
            --flame: {COLORS['flame']};
            --text: {COLORS['text']};
            --text-soft: {COLORS['text_soft']};
            --text-faint: {COLORS['text_faint']};
            --success: {COLORS['success']};
        }}

        html, body, [class*="css"] {{
            font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
        }}

        code, .stCode, pre {{
            font-family: 'JetBrains Mono', monospace !important;
        }}

        /* ---------------- App background: slow-drifting gradient mesh ---------------- */
        .stApp {{
            background:
                radial-gradient(circle at 12% 8%, rgba(34, 211, 238, 0.10) 0%, transparent 42%),
                radial-gradient(circle at 88% 15%, rgba(139, 92, 246, 0.10) 0%, transparent 45%),
                radial-gradient(circle at 50% 100%, rgba(251, 146, 60, 0.06) 0%, transparent 55%),
                linear-gradient(180deg, var(--bg) 0%, var(--bg-soft) 100%);
            background-attachment: fixed;
        }}

        [data-testid="stSidebar"] {{
            background: linear-gradient(180deg, #0A1120 0%, #0D1424 100%);
            border-right: 1px solid var(--panel-border);
        }}

        [data-testid="stSidebar"] * {{
            color: var(--text-soft) !important;
        }}

        [data-testid="stHeader"] {{
            background: transparent;
        }}

        /* ---------------- Keyframes ---------------- */
        @keyframes flux-drift {{
            0%   {{ background-position: 0% 50%; }}
            50%  {{ background-position: 100% 50%; }}
            100% {{ background-position: 0% 50%; }}
        }}
        @keyframes flux-fade-up {{
            from {{ opacity: 0; transform: translateY(14px); }}
            to   {{ opacity: 1; transform: translateY(0); }}
        }}
        @keyframes flux-pulse-glow {{
            0%, 100% {{ box-shadow: 0 0 0px rgba(34, 211, 238, 0.0); }}
            50%      {{ box-shadow: 0 0 26px rgba(34, 211, 238, 0.20); }}
        }}
        @keyframes flux-flow {{
            0%   {{ transform: translateX(-8%); }}
            100% {{ transform: translateX(108%); }}
        }}
        @keyframes flux-flicker {{
            0%, 100% {{ opacity: 1; }}
            45%      {{ opacity: 0.72; }}
            55%      {{ opacity: 0.9; }}
        }}
        @keyframes flux-spin-slow {{
            from {{ transform: rotate(0deg); }}
            to   {{ transform: rotate(360deg); }}
        }}

        /* ---------------- Hero header ---------------- */
        .flux-hero {{
            position: relative;
            padding: 2.4rem 2.2rem;
            border-radius: 22px;
            margin-bottom: 1.6rem;
            overflow: hidden;
            background: linear-gradient(120deg, #0E1830 0%, #101B36 45%, #14133A 100%);
            background-size: 200% 200%;
            animation: flux-drift 14s ease-in-out infinite;
            border: 1px solid var(--panel-border);
        }}
        .flux-hero::before {{
            content: "";
            position: absolute;
            top: -40%;
            left: -10%;
            width: 60%;
            height: 220%;
            background: linear-gradient(90deg, transparent, rgba(34,211,238,0.06), transparent);
            animation: flux-flow 6s linear infinite;
            pointer-events: none;
        }}
        .flux-hero-row {{
            display: flex;
            align-items: center;
            gap: 1.2rem;
            position: relative;
            z-index: 1;
        }}
        .flux-hero-logo {{
            width: 58px;
            height: 58px;
            border-radius: 16px;
            flex-shrink: 0;
            animation: flux-fade-up 0.7s ease-out;
            filter: drop-shadow(0 0 18px rgba(34, 211, 238, 0.35));
        }}
        .flux-hero-title {{
            font-size: 2.15rem;
            font-weight: 800;
            margin: 0;
            line-height: 1.15;
            background: linear-gradient(90deg, #67E8F9 0%, #93C5FD 40%, #C4B5FD 75%, #FDBA74 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: flux-fade-up 0.7s ease-out 0.05s both;
        }}
        .flux-hero-sub {{
            color: var(--text-soft);
            font-size: 0.96rem;
            margin-top: 0.35rem;
            animation: flux-fade-up 0.7s ease-out 0.12s both;
        }}
        .flux-hero-tagline {{
            margin-top: 0.9rem;
            color: var(--text-faint);
            font-size: 0.85rem;
            letter-spacing: 0.02em;
            animation: flux-fade-up 0.7s ease-out 0.18s both;
        }}

        /* ---------------- Badges / pills ---------------- */
        .flux-pill {{
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.28rem 0.78rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            border: 1px solid rgba(34, 211, 238, 0.28);
            background: rgba(34, 211, 238, 0.08);
            color: #7DD3FC;
            margin-right: 0.5rem;
        }}
        .flux-pill-dot {{
            width: 6px; height: 6px; border-radius: 50%;
            background: var(--success);
            animation: flux-flicker 2.2s ease-in-out infinite;
            box-shadow: 0 0 8px var(--success);
        }}

        /* ---------------- Module / info cards ---------------- */
        .flux-card {{
            position: relative;
            background: linear-gradient(160deg, rgba(17,26,46,0.9) 0%, rgba(13,20,36,0.9) 100%);
            border: 1px solid var(--panel-border);
            border-radius: 18px;
            padding: 1.5rem 1.5rem 1.4rem 1.5rem;
            height: 100%;
            transition: transform 0.28s cubic-bezier(.2,.8,.2,1), border-color 0.28s, box-shadow 0.28s;
            animation: flux-fade-up 0.6s ease-out both;
        }}
        .flux-card:hover {{
            transform: translateY(-6px);
            border-color: rgba(34, 211, 238, 0.45);
            box-shadow: 0 14px 34px rgba(0,0,0,0.35), 0 0 24px rgba(34,211,238,0.10);
        }}
        .flux-card-icon {{
            font-size: 1.7rem;
            display: inline-block;
            margin-bottom: 0.7rem;
        }}
        .flux-card-title {{
            font-size: 1.08rem;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 0.45rem;
        }}
        .flux-card-desc {{
            font-size: 0.87rem;
            color: var(--text-soft);
            line-height: 1.5;
        }}
        .flux-card-tag {{
            display: inline-block;
            margin-top: 0.85rem;
            font-size: 0.72rem;
            font-weight: 600;
            color: var(--text-faint);
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }}

        /* Card accent bar, colour set per-card via inline style variable */
        .flux-card::after {{
            content: "";
            position: absolute;
            top: 0; left: 0;
            width: 100%;
            height: 3px;
            border-radius: 18px 18px 0 0;
            background: linear-gradient(90deg, var(--accent-a, var(--cyan)), var(--accent-b, var(--blue)));
        }}

        /* ---------------- Metric cards (used across dashboards) ---------------- */
        .flux-metric {{
            background: rgba(17, 26, 46, 0.65);
            border: 1px solid var(--panel-border);
            border-radius: 14px;
            padding: 0.95rem 1.1rem;
            animation: flux-fade-up 0.5s ease-out both;
        }}
        .flux-metric-label {{
            font-size: 0.72rem;
            color: var(--text-faint);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
        }}
        .flux-metric-value {{
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text);
            font-family: 'JetBrains Mono', monospace;
        }}
        .flux-metric-unit {{
            font-size: 0.85rem;
            color: var(--text-soft);
            font-weight: 500;
            margin-left: 0.15rem;
        }}

        /* ---------------- Section dividers with a flowing line ---------------- */
        .flux-divider {{
            position: relative;
            height: 1px;
            margin: 1.8rem 0;
            background: var(--panel-border);
            overflow: hidden;
        }}
        .flux-divider::after {{
            content: "";
            position: absolute;
            top: 0; left: -20%;
            width: 20%; height: 100%;
            background: linear-gradient(90deg, transparent, var(--cyan), transparent);
            animation: flux-flow 3.2s linear infinite;
        }}

        /* ---------------- Streamlit widget restyling ---------------- */
        .stButton > button, .stDownloadButton > button {{
            background: linear-gradient(120deg, var(--cyan), var(--blue));
            color: #06111F;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            padding: 0.55rem 1.3rem;
            transition: transform 0.18s ease, box-shadow 0.18s ease;
            box-shadow: 0 4px 14px rgba(34, 211, 238, 0.18);
        }}
        .stButton > button:hover, .stDownloadButton > button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 8px 22px rgba(34, 211, 238, 0.30);
        }}

        [data-testid="stMetric"] {{
            background: rgba(17, 26, 46, 0.55);
            border: 1px solid var(--panel-border);
            border-radius: 14px;
            padding: 0.8rem 1rem;
        }}

        .stTabs [data-baseweb="tab-list"] {{
            gap: 6px;
        }}
        .stTabs [data-baseweb="tab"] {{
            background: rgba(17, 26, 46, 0.5);
            border-radius: 10px 10px 0 0;
            border: 1px solid var(--panel-border);
            border-bottom: none;
            color: var(--text-soft);
        }}
        .stTabs [aria-selected="true"] {{
            background: rgba(34, 211, 238, 0.10) !important;
            color: var(--cyan) !important;
        }}

        [data-testid="stExpander"] {{
            background: rgba(17, 26, 46, 0.45);
            border: 1px solid var(--panel-border);
            border-radius: 14px;
        }}

        .stAlert {{
            border-radius: 14px !important;
            border: 1px solid var(--panel-border) !important;
        }}

        h1, h2, h3 {{
            color: var(--text) !important;
        }}

        /* Footer credit strip */
        .flux-footer {{
            margin-top: 3rem;
            padding-top: 1.2rem;
            border-top: 1px solid var(--panel-border);
            color: var(--text-faint);
            font-size: 0.78rem;
            text-align: center;
        }}

        </style>
        """,
        unsafe_allow_html=True,
    )


def hero(title: str, subtitle: str, tagline: str = "", pills: list[str] | None = None) -> None:
    """Render the animated gradient hero header used at the top of every page."""
    logo_b64 = _logo_base64()
    logo_html = (
        f'<img src="data:image/png;base64,{logo_b64}" class="flux-hero-logo" />'
        if logo_b64
        else '<div class="flux-hero-logo" style="background:linear-gradient(135deg,var(--cyan),var(--violet));"></div>'
    )
    pills_html = ""
    if pills:
        chips = "".join(
            f'<span class="flux-pill"><span class="flux-pill-dot"></span>{p}</span>' for p in pills
        )
        pills_html = f'<div style="margin-top:0.9rem;">{chips}</div>'

    st.markdown(
        f"""
        <div class="flux-hero">
            <div class="flux-hero-row">
                {logo_html}
                <div>
                    <p class="flux-hero-title">{title}</p>
                    <p class="flux-hero-sub">{subtitle}</p>
                </div>
            </div>
            {f'<p class="flux-hero-tagline">{tagline}</p>' if tagline else ''}
            {pills_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def module_card(icon: str, title: str, desc: str, tag: str, accent: str = "cyan-blue", delay: float = 0.0) -> str:
    """Return the HTML string for one animated module card (place inside st.markdown)."""
    accents = {
        "cyan-blue": (COLORS["cyan"], COLORS["blue"]),
        "blue-violet": (COLORS["blue"], COLORS["violet"]),
        "violet-flame": (COLORS["violet"], COLORS["flame"]),
        "amber-flame": (COLORS["amber"], COLORS["flame"]),
    }
    a, b = accents.get(accent, accents["cyan-blue"])
    return f"""
    <div class="flux-card" style="--accent-a:{a}; --accent-b:{b}; animation-delay:{delay}s;">
        <span class="flux-card-icon">{icon}</span>
        <div class="flux-card-title">{title}</div>
        <div class="flux-card-desc">{desc}</div>
        <div class="flux-card-tag">{tag}</div>
    </div>
    """


def divider() -> None:
    st.markdown('<div class="flux-divider"></div>', unsafe_allow_html=True)


def footer(text: str = "FlowThermal Suite · PE 262 Capstone · Built with Streamlit") -> None:
    st.markdown(f'<div class="flux-footer">{text}</div>', unsafe_allow_html=True)
