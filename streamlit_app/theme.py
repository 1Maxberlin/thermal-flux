"""theme.py — Shared visual identity for the FlowThermal Suite.

Import `apply_theme()` at the top of every page (app.py and each file in
pages/) to get consistent fonts, colours, and the reusable component
helpers (hero header, metric cards, module cards).

Nothing in here touches engineering.py or any calculation logic — this
file is presentation only.
"""

from pathlib import Path
import base64
import streamlit as st

ASSETS_DIR = Path(__file__).parent / "assets"
LOGO_PATH = ASSETS_DIR / "logo.png"

# ----------------------------------------------------------------------
# Palette — light theme. Cyan -> blue -> violet accent family kept from
# the original brand, now used as accents on a white/near-white surface
# instead of as text-fill on dark.
# ----------------------------------------------------------------------
COLORS = {
    "bg": "#FFFFFF",
    "bg_soft": "#F7F9FC",
    "panel": "#FFFFFF",
    "panel_border": "rgba(15, 23, 42, 0.08)",
    "cyan": "#0EA5B7",
    "blue": "#2563EB",
    "violet": "#7C3AED",
    "amber": "#D97706",
    "flame": "#EA580C",
    "text": "#0F172A",
    "text_soft": "#475569",
    "text_faint": "#94A3B8",
    "success": "#059669",
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

        /* ---------------- App background: soft, clean, light ---------------- */
        .stApp {{
            background:
                radial-gradient(circle at 12% 0%, rgba(37, 99, 235, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 88% 10%, rgba(124, 58, 237, 0.05) 0%, transparent 45%),
                var(--bg);
            background-attachment: fixed;
        }}

        [data-testid="stSidebar"] {{
            background: var(--bg-soft);
            border-right: 1px solid var(--panel-border);
        }}

        [data-testid="stSidebar"] * {{
            color: var(--text-soft) !important;
        }}

        [data-testid="stHeader"] {{
            background: transparent;
        }}

        /* ---------------- Keyframes ---------------- */
        @keyframes flux-fade-up {{
            from {{ opacity: 0; transform: translateY(14px); }}
            to   {{ opacity: 1; transform: translateY(0); }}
        }}
        @keyframes flux-flicker {{
            0%, 100% {{ opacity: 1; }}
            45%      {{ opacity: 0.72; }}
            55%      {{ opacity: 0.9; }}
        }}

        /* ---------------- Hero header ---------------- */
        .flux-hero {{
            position: relative;
            padding: 3rem 2.4rem;
            border-radius: 24px;
            margin-bottom: 1.8rem;
            overflow: hidden;
            background: linear-gradient(135deg, #F8FAFF 0%, #F1F5FF 55%, #FAF5FF 100%);
            border: 1px solid var(--panel-border);
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
            box-shadow: 0 6px 18px rgba(37, 99, 235, 0.18);
        }}
        .flux-hero-title {{
            font-size: 2.35rem;
            font-weight: 800;
            margin: 0;
            line-height: 1.15;
            color: var(--text);
            animation: flux-fade-up 0.7s ease-out 0.05s both;
        }}
        .flux-hero-title .flux-accent {{
            background: linear-gradient(90deg, var(--blue), var(--violet));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        .flux-hero-sub {{
            color: var(--text-soft);
            font-size: 1rem;
            margin-top: 0.4rem;
            animation: flux-fade-up 0.7s ease-out 0.12s both;
        }}
        .flux-hero-tagline {{
            margin-top: 1.1rem;
            color: var(--text-soft);
            font-size: 0.95rem;
            line-height: 1.6;
            max-width: 640px;
            animation: flux-fade-up 0.7s ease-out 0.18s both;
        }}

        /* ---------------- Badges / pills ---------------- */
        .flux-pill {{
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.32rem 0.85rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            border: 1px solid rgba(37, 99, 235, 0.18);
            background: #FFFFFF;
            color: var(--blue);
            margin-right: 0.5rem;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }}
        .flux-pill-dot {{
            width: 6px; height: 6px; border-radius: 50%;
            background: var(--success);
            animation: flux-flicker 2.2s ease-in-out infinite;
        }}

        /* ---------------- Module / info cards ---------------- */
        .flux-card {{
            position: relative;
            background: #FFFFFF;
            border: 1px solid var(--panel-border);
            border-radius: 18px;
            padding: 1.6rem 1.6rem 1.5rem 1.6rem;
            height: 100%;
            transition: transform 0.22s cubic-bezier(.2,.8,.2,1), box-shadow 0.22s, border-color 0.22s;
            animation: flux-fade-up 0.6s ease-out both;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }}
        .flux-card:hover {{
            transform: translateY(-4px);
            border-color: rgba(37, 99, 235, 0.25);
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
        }}
        .flux-card-icon-chip {{
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.35rem;
            margin-bottom: 0.9rem;
            background: linear-gradient(135deg, var(--accent-a, var(--cyan)), var(--accent-b, var(--blue)));
        }}
        .flux-card-title {{
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 0.5rem;
        }}
        .flux-card-desc {{
            font-size: 0.9rem;
            color: var(--text-soft);
            line-height: 1.55;
            margin-bottom: 0.9rem;
        }}
        .flux-card-checklist {{
            list-style: none;
            padding: 0;
            margin: 0 0 0.4rem 0;
        }}
        .flux-card-checklist li {{
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: var(--text-soft);
            margin-bottom: 0.4rem;
        }}
        .flux-card-checklist li::before {{
            content: "✓";
            color: var(--success);
            font-weight: 700;
            flex-shrink: 0;
        }}
        .flux-card-tag {{
            display: inline-block;
            margin-top: 0.5rem;
            font-size: 0.72rem;
            font-weight: 700;
            color: var(--text-faint);
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }}

        /* ---------------- Metric / stat cards ---------------- */
        .flux-metric {{
            background: #FFFFFF;
            border: 1px solid var(--panel-border);
            border-radius: 14px;
            padding: 1rem 1.15rem;
            animation: flux-fade-up 0.5s ease-out both;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }}
        .flux-metric-label {{
            font-size: 0.75rem;
            color: var(--text-faint);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.3rem;
        }}
        .flux-metric-value {{
            font-size: 1.6rem;
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

        /* ---------------- Section dividers ---------------- */
        .flux-divider {{
            height: 1px;
            margin: 2rem 0;
            background: var(--panel-border);
        }}

        /* ---------------- Streamlit widget restyling ---------------- */
        .stButton > button, .stDownloadButton > button {{
            background: linear-gradient(120deg, var(--blue), var(--violet));
            color: #FFFFFF;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            padding: 0.6rem 1.4rem;
            transition: transform 0.18s ease, box-shadow 0.18s ease;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.20);
        }}
        .stButton > button:hover, .stDownloadButton > button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
        }}

        [data-testid="stMetric"] {{
            background: #FFFFFF;
            border: 1px solid var(--panel-border);
            border-radius: 14px;
            padding: 0.9rem 1.1rem;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }}

        .stTabs [data-baseweb="tab-list"] {{
            gap: 6px;
        }}
        .stTabs [data-baseweb="tab"] {{
            background: var(--bg-soft);
            border-radius: 10px 10px 0 0;
            border: 1px solid var(--panel-border);
            border-bottom: none;
            color: var(--text-soft);
        }}
        .stTabs [aria-selected="true"] {{
            background: rgba(37, 99, 235, 0.08) !important;
            color: var(--blue) !important;
        }}

        [data-testid="stExpander"] {{
            background: #FFFFFF;
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

        p, span, label, div {{
            color: var(--text);
        }}

        /* Footer credit strip */
        .flux-footer {{
            margin-top: 3rem;
            padding-top: 1.2rem;
            border-top: 1px solid var(--panel-border);
            color: var(--text-faint);
            font-size: 0.8rem;
            text-align: center;
        }}

        </style>
        """,
        unsafe_allow_html=True,
    )


def hero(title: str, subtitle: str, tagline: str = "", pills: list[str] | None = None,
         accent_word: str | None = None) -> None:
    """Render the light hero header used at the top of every page.

    If accent_word is given and found in `title`, that word is rendered
    with the gradient accent treatment (matches the reference design's
    'Engineering' highlight in the headline).
    """
    logo_b64 = _logo_base64()
    logo_html = (
        f'<img src="data:image/png;base64,{logo_b64}" class="flux-hero-logo" />'
        if logo_b64
        else '<div class="flux-hero-logo" style="background:linear-gradient(135deg,var(--cyan),var(--violet));"></div>'
    )

    title_html = title
    if accent_word and accent_word in title:
        title_html = title.replace(accent_word, f'<span class="flux-accent">{accent_word}</span>')

    pills_html = ""
    if pills:
        chips = "".join(
            f'<span class="flux-pill"><span class="flux-pill-dot"></span>{p}</span>' for p in pills
        )
        pills_html = f'<div style="margin-top:1.1rem;">{chips}</div>'

    st.markdown(
        f"""
        <div class="flux-hero">
            <div class="flux-hero-row">
                {logo_html}
                <div>
                    <p class="flux-hero-title">{title_html}</p>
                    <p class="flux-hero-sub">{subtitle}</p>
                </div>
            </div>
            {f'<p class="flux-hero-tagline">{tagline}</p>' if tagline else ''}
            {pills_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def module_card(icon: str, title: str, desc: str, tag: str, accent: str = "cyan-blue",
                 delay: float = 0.0, checklist: list[str] | None = None) -> str:
    """Return the HTML string for one module card (place inside st.markdown).

    checklist: optional list of short bullet strings shown with a check
    mark, matching the reference design's feature lists under each card.
    """
    accents = {
        "cyan-blue": (COLORS["cyan"], COLORS["blue"]),
        "blue-violet": (COLORS["blue"], COLORS["violet"]),
        "violet-flame": (COLORS["violet"], COLORS["flame"]),
        "amber-flame": (COLORS["amber"], COLORS["flame"]),
    }
    a, b = accents.get(accent, accents["cyan-blue"])

    checklist_html = ""
    if checklist:
        items = "".join(f"<li>{item}</li>" for item in checklist)
        checklist_html = f'<ul class="flux-card-checklist">{items}</ul>'

    return f"""
    <div class="flux-card" style="--accent-a:{a}; --accent-b:{b}; animation-delay:{delay}s;">
        <div class="flux-card-icon-chip">{icon}</div>
        <div class="flux-card-title">{title}</div>
        <div class="flux-card-desc">{desc}</div>
        {checklist_html}
        <div class="flux-card-tag">{tag}</div>
    </div>
    """


def divider() -> None:
    st.markdown('<div class="flux-divider"></div>', unsafe_allow_html=True)


def footer(text: str = "FlowThermal Suite · PE 262 Capstone · Built with Streamlit") -> None:
    st.markdown(f'<div class="flux-footer">{text}</div>', unsafe_allow_html=True)
